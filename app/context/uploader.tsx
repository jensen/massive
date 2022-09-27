import {
  createContext,
  useContext,
  useState,
  useReducer,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  splitChunks,
  uploadChunks,
  checkResume,
  completeUpload,
  getExistingUploads,
} from "~/utils/s3";
import { generateFilename, readableFileSize } from "~/utils/file";
import { addObject } from "~/api/storage";

import type { PropsWithChildren } from "react";

const CONCURRENT_CHUNKS_PER_FILE = 5;

type ReducerAction =
  | { type: "START_CHUNKS"; uploading: FileChunk[] }
  | { type: "UPDATE_CHUNK"; number: number; loaded: number }
  | { type: "END_CHUNKS" }
  | { type: "SET_BYTES_UPLOADED"; bytesUploaded: number };

interface ReducerState {
  uploading: ChunkProgress[];
  bytesUploaded: number;
  ts: number;
  speed: number;
}

const reducer = (state: ReducerState, action: ReducerAction): ReducerState => {
  if (action.type === "UPDATE_CHUNK") {
    const uploading = state.uploading.map((upload) =>
      upload.number === action.number
        ? {
            ...upload,
            loaded: action.loaded,
          }
        : upload
    );

    return {
      ...state,
      uploading,
    };
  }

  if (action.type === "START_CHUNKS") {
    return {
      ...state,
      uploading: [
        ...state.uploading,
        ...action.uploading.map((chunk) => ({
          number: chunk.number,
          loaded: 0,
        })),
      ],
      ts: Date.now(),
    };
  }

  if (action.type === "END_CHUNKS") {
    const bytesComplete = state.uploading.reduce(
      (sum, upload) => sum + upload.loaded,
      0
    );

    const speed = bytesComplete / ((Date.now() - state.ts) / 1000);

    return {
      ...state,
      bytesUploaded: state.bytesUploaded + bytesComplete,
      uploading: [],
      speed: (state.speed + speed) / 2,
      ts: 0,
    };
  }

  if (action.type === "SET_BYTES_UPLOADED") {
    return {
      ...state,
      bytesUploaded: action.bytesUploaded,
    };
  }

  return state;
};

const UploaderContext = createContext<{
  add: (files: File[]) => Promise<void>;
  start: () => Promise<void>;
  complete: (key: string, uploadId: string, parts: any) => void;
  incomplete: (key: string) => void;
  uploads: Upload[];
  existing: MultipartUpload[];
}>({
  add: (files: File[]) => Promise.resolve(undefined),
  start: () => Promise.resolve(undefined),
  complete: (key: string, uploadId: string, parts: any) =>
    Promise.resolve(undefined),
  incomplete: (key: string) => Promise.resolve(undefined),
  uploads: [],
  existing: [],
});

interface UploaderProviderProps {}

export default function UploaderProvider(
  props: PropsWithChildren<UploaderProviderProps>
) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [existing, setExisting] = useState<MultipartUpload[]>([]);

  const complete = useCallback(
    async (key: string, uploadId: string, parts: MultipartUploadPart[]) => {
      const upload = uploads.find(
        (upload) => upload.key === key && upload.uploading
      );

      if (upload === undefined) {
        throw new Error("Could not find upload");
      }

      await completeUpload(key, uploadId, parts);

      const id = upload.key.split(".")[0];
      const { name, type, size } = upload.file;

      await addObject({
        id,
        name,
        type,
        size,
      });

      setUploads((prev) => {
        const finishedIndex = prev.findIndex((upload) => upload.key === key);

        return prev.map((upload, index) => {
          if (finishedIndex === index) {
            return {
              ...upload,
              complete: true,
              uploading: false,
            };
          }

          if (finishedIndex + 1 === index) {
            return {
              ...upload,
              uploading: true,
            };
          }

          return upload;
        });
      });
    },
    [uploads]
  );

  const incomplete = useCallback(
    async (key: string) => {
      const upload = uploads.find(
        (upload) => upload.key === key && upload.uploading
      );

      if (upload === undefined) {
        throw new Error("Could not find upload");
      }

      setUploads((prev) => {
        return prev.map((upload, index) => {
          if (upload.key === key) {
            return {
              ...upload,
              uploading: false,
              error: true,
            };
          }

          return upload;
        });
      });
    },
    [uploads]
  );

  const start = async () => {
    setUploads((prev) => {
      const next = prev.findIndex(
        (upload) => upload.uploading === false && upload.complete === false
      );

      return prev.map((upload, index) =>
        index === next ? { ...upload, uploading: true } : upload
      );
    });
  };

  const add = async (files: File[]) => {
    const { uploads: existing } = await getExistingUploads();

    const uploads: Upload[] = await Promise.all(
      files.map((file) =>
        generateFilename(file).then((key) => ({
          key,
          complete: false,
          uploading: false,
          error: false,
          file,
        }))
      )
    );

    setExisting(existing);
    setUploads((prev) => [...prev, ...uploads]);
  };

  return (
    <UploaderContext.Provider
      value={{
        add,
        start,
        complete,
        incomplete,
        uploads,
        existing,
      }}
    >
      {props.children}
    </UploaderContext.Provider>
  );
}

export const useUploader = () => {
  return useContext(UploaderContext);
};

export const useFileUpload = (upload: Upload) => {
  const { complete, incomplete, existing } = useContext(UploaderContext);

  const [uploadId, setUploadId] = useState<string | null>(null);
  const [parts, setParts] = useState<MultipartUploadPart[]>([]);

  const [progress, dispatch] = useReducer(reducer, {
    uploading: [],
    bytesUploaded: 0,
    ts: 0,
    speed: 0,
  });

  const chunks = useRef<FileChunk[]>([]);

  const handleProgress = useCallback(({ number, loaded }: ChunkProgress) => {
    dispatch({ type: "UPDATE_CHUNK", number, loaded });
  }, []);

  const { key, uploading, file } = upload;

  useEffect(() => {
    if (uploadId === null) {
      checkResume(file, existing).then(({ uploadId, parts }) => {
        setUploadId(uploadId);
        setParts(parts);

        dispatch({
          type: "SET_BYTES_UPLOADED",
          bytesUploaded: parts.reduce((sum, part) => sum + part.Size, 0),
        });
      });
    }
  }, [existing, uploadId, file]);

  useEffect(() => {
    if (uploadId && uploading) {
      if (chunks.current.length === 0) {
        chunks.current = splitChunks(file, parts);
      }

      const upload = async (uploading: FileChunk[]) => {
        dispatch({ type: "START_CHUNKS", uploading });

        try {
          const uploaded = await uploadChunks(
            key,
            uploadId,
            uploading,
            handleProgress
          );

          for (const upload of uploaded) {
            const chunk = chunks.current.find(
              (chunk) => chunk.number === upload.PartNumber
            );

            if (chunk) {
              chunk.ETag = upload.ETag;
              chunk.complete = true;
            }
          }

          dispatch({ type: "END_CHUNKS" });
        } catch (error) {
          incomplete(key);
        }
      };

      const first = chunks.current.findIndex(
        (chunk) => chunk.complete === false
      );

      if (first !== -1) {
        upload(
          chunks.current.slice(
            first,
            first +
              Math.min(
                CONCURRENT_CHUNKS_PER_FILE,
                chunks.current.length + 1 - first
              )
          )
        );
      } else {
        complete(
          key,
          uploadId,
          chunks.current.map((part) => ({
            PartNumber: part.number,
            ETag: part.ETag,
          }))
        );
      }
    }
  }, [
    key,
    uploadId,
    uploading,
    file,
    parts,
    handleProgress,
    complete,
    incomplete,
    progress.bytesUploaded,
  ]);

  return {
    percentage: (
      (progress.uploading.reduce(
        (total, { loaded }) => total + loaded,
        progress.bytesUploaded
      ) /
        upload.file.size) *
      100
    ).toFixed(0),
    ready: uploadId !== null,
    speed: {
      calculating: progress.speed === 0 && uploading,
      raw: progress.speed,
      readable: `${readableFileSize(progress.speed)}/sec`,
    },
  };
};
