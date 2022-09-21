import * as storage from "~/api/storage";
import { generateFilename } from "./file";

export const splitChunks = (file: File, parts: MultipartUploadPart[]) => {
  const chunks: FileChunk[] = [];
  const size = Math.max(5 * 1024 * 1024, Math.ceil(file.size / 10000));

  const existing = parts.reduce((existing, part) => {
    existing[part.PartNumber] = part;
    return existing;
  }, {} as { [key: string]: MultipartUploadPart });

  if (file.size === 0) {
    chunks.push({
      number: 1,
      complete: false,
      ETag: "",
      data: file.slice(0),
    });
  } else {
    for (let i = 0; i < file.size; i += size) {
      const chunk = existing[chunks.length + 1] || null;

      chunks.push({
        number: chunks.length + 1,
        complete: chunk !== null,
        ETag: chunk ? chunk.ETag : "",
        data: file.slice(i, Math.min(file.size, i + size)),
      });
    }
  }

  return chunks;
};

const uploadPart = (
  number: number,
  url: string,
  data: Blob,
  handleProgress: ({ number, loaded }: ChunkProgress) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("put", url, true);

    request.upload.addEventListener("progress", (event) => {
      handleProgress({ number, loaded: event.loaded });
    });

    request.addEventListener("error", (event) => {
      reject(new Error(`Uploading part ${number} failed`));
    });

    request.addEventListener("load", (event) => {
      if (event.target) {
        resolve(
          (event.target as XMLHttpRequest).getResponseHeader("ETag") as string
        );
      }
    });

    request.send(data);
  });
};

const prepareUploadFile = async (file: File) => {
  const { uploadId, key } = await storage.createMultipartUpload({
    name: await generateFilename(file),
  });

  return { uploadId, key, parts: [] };
};

const prepareResumeFile = async ({
  key,
  uploadId,
}: {
  key: string;
  uploadId: string;
}) => {
  const { parts } = await storage.listParts({
    key,
    uploadId,
  });

  return {
    uploadId,
    key,
    parts: parts || [],
  };
};

export const uploadChunks = async (
  key: string,
  uploadId: string,
  chunks: FileChunk[],
  handleProgress: ({ number, loaded }: ChunkProgress) => void
) => {
  const { presignedUrls } = await storage.prepareUploadParts({
    key,
    uploadId,
    parts: chunks.map((chunk) => chunk.number),
  });

  return await Promise.all(
    chunks.map((chunk) =>
      uploadPart(
        chunk.number,
        presignedUrls[chunk.number],
        chunk.data,
        handleProgress
      ).then((ETag) => ({
        PartNumber: chunk.number,
        ETag: ETag,
      }))
    )
  );
};

export const checkResume = async (file: File, uploads?: MultipartUpload[]) => {
  if (uploads) {
    for (const upload of uploads) {
      if (upload.Key === (await generateFilename(file))) {
        return await prepareResumeFile({
          key: upload.Key,
          uploadId: upload.UploadId,
        });
      }
    }
  }

  return await prepareUploadFile(file);
};

export const completeUpload = (
  key: string,
  uploadId: string,
  parts: MultipartUploadPart[]
) => {
  return storage.completeMultipartUpload({
    key,
    uploadId,
    parts,
  });
};

export const getExistingUploads = () => {
  return storage.listMultipartUploads();
};
