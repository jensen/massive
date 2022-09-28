import * as storage from "~/api/storage";
import { generateFilename } from "./file";

const NUMBER_OF_RETRIES = 3;
const MINIMUM_CHUNK_SIZE = 5 * 1024 * 1024;

export const splitChunks = (file: File, parts: MultipartUploadPart[]) => {
  const chunks: FileChunk[] = [];
  const size = Math.max(MINIMUM_CHUNK_SIZE, Math.ceil(file.size / 10000));

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
): Promise<{ PartNumber: number; ETag: string }> => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("put", url, true);

    request.upload.onprogress = (event) => {
      handleProgress({ number, loaded: event.loaded });
    };

    request.onerror = (event) => {
      reject(new Error(`Uploading part ${number} failed`));
    };

    request.onload = (event) => {
      if (event.target) {
        if (request.status === 200) {
          resolve({
            PartNumber: number,
            ETag: (event.target as XMLHttpRequest).getResponseHeader(
              "ETag"
            ) as string,
          });
        } else {
          reject(
            new Error(
              `Uploading part ${number} failed: status ${request.status}`
            )
          );
        }
      }
    };

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
  handleProgress: ({ number, loaded }: ChunkProgress) => void,
  retry: number = 0
): Promise<{ PartNumber: number; ETag: string }[]> => {
  const { presignedUrls } = await storage.prepareUploadParts({
    key,
    uploadId,
    parts: chunks.map((chunk) => chunk.number),
  });

  try {
    return await Promise.all(
      chunks.map((chunk) =>
        uploadPart(
          chunk.number,
          presignedUrls[chunk.number],
          chunk.data,
          handleProgress
        )
      )
    );
  } catch (error) {
    if (retry < NUMBER_OF_RETRIES) {
      return uploadChunks(key, uploadId, chunks, handleProgress, retry + 1);
    } else {
      throw new Error("Cannot upload file");
    }
  }
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
