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

import type { PropsWithChildren } from "react";

const CONCURRENT_CHUNKS_PER_FILE = 5;

type ReducerAction =
  | { type: "START_CHUNKS"; uploading: FileChunk[] }
  | { type: "UPDATE_CHUNK"; number: number; loaded: number }
  | { type: "END_CHUNKS" };

interface ReducerState {
  uploading: ChunkProgress[];
  bytesUploaded: number;
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
        ...action.uploading.map((upload) => ({
          number: upload.number,
          loaded: 0,
        })),
      ],
    };
  }

  if (action.type === "END_CHUNKS") {
    return {
      ...state,
      bytesUploaded:
        state.bytesUploaded +
        state.uploading.reduce((sum, upload) => sum + upload.loaded, 0),
      uploading: [],
    };
  }

  return state;
};

const UploaderContext = createContext<{
  add: (files: File[]) => Promise<void>;
  start: () => Promise<void>;
  complete: (key: string, uploadId: string, parts: any) => void;
  uploads: Upload[];
}>({
  add: (files: File[]) => Promise.resolve(undefined),
  start: () => Promise.resolve(undefined),
  complete: (key: string, uploadId: string, parts: any) =>
    Promise.resolve(undefined),
  uploads: [],
});

interface UploaderProviderProps {}

export default function UploaderProvider(
  props: PropsWithChildren<UploaderProviderProps>
) {
  const [uploads, setUploads] = useState<Upload[]>([]);

  const complete = useCallback(
    async (key: string, uploadId: string, parts: MultipartUploadPart[]) => {
      await completeUpload(key, uploadId, parts);

      setUploads((prev) => {
        const finishedIndex = prev.findIndex(
          (upload) => upload.uploadId === uploadId
        );

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
    []
  );

  const start = async () => {
    setUploads((prev) =>
      prev.map((upload, index) =>
        index === 0 ? { ...upload, uploading: true } : upload
      )
    );
  };

  const add = async (files: File[]) => {
    const { uploads: existing } = await getExistingUploads();

    const uploads: Upload[] = await Promise.all(
      files.map((file) =>
        checkResume(file, existing).then(({ key, uploadId, parts }) => ({
          key,
          uploadId,
          complete: false,
          uploading: false,
          parts,
          file,
        }))
      )
    );

    setUploads(uploads);
  };

  return (
    <UploaderContext.Provider
      value={{
        add,
        start,
        complete,
        uploads,
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
  const { complete } = useContext(UploaderContext);

  const [progress, dispatch] = useReducer(reducer, {
    uploading: [],
    bytesUploaded: upload.parts.reduce((sum, part) => sum + part.Size, 0),
  });

  const chunks = useRef<FileChunk[]>([]);

  const handleProgress = useCallback(({ number, loaded }: ChunkProgress) => {
    dispatch({ type: "UPDATE_CHUNK", number, loaded });
  }, []);

  const { key, uploadId, uploading, file, parts } = upload;

  useEffect(() => {
    if (uploading) {
      if (chunks.current.length === 0) {
        chunks.current = splitChunks(file, parts);
      }

      const upload = async (uploading: FileChunk[]) => {
        dispatch({ type: "START_CHUNKS", uploading });

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
  };
};
