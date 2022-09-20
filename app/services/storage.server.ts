import {
  S3Client,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  DeleteBucketCorsCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  ListMultipartUploadsCommand,
  ListPartsCommand,
  AbortMultipartUploadCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const storageConfig = {
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION,
  credentials: {
    accessKeyId: process.env.STORAGE_KEY || "",
    secretAccessKey: process.env.STORAGE_SECRET || "",
  },
};

const commandConfig = {
  Bucket: process.env.STORAGE_BUCKET,
};

const createClient = () => {
  return new S3Client(storageConfig);
};

export const getBucketCors = () => {
  return createClient().send(new GetBucketCorsCommand(commandConfig));
};

export const putBucketCors = (policy: string) => {
  return createClient().send(
    new PutBucketCorsCommand({
      ...commandConfig,
      CORSConfiguration: JSON.parse(policy),
    })
  );
};

export const deleteBucketCors = () => {
  return createClient().send(new DeleteBucketCorsCommand(commandConfig));
};

export const listObjects = () => {
  return createClient().send(new ListObjectsV2Command(commandConfig));
};

export const listMultipartUploads = () => {
  return createClient().send(new ListMultipartUploadsCommand(commandConfig));
};

export const createMultipartUpload = (
  key: string
): Promise<{ Key: string; UploadId: string }> => {
  return createClient().send(
    new CreateMultipartUploadCommand({
      ...commandConfig,
      Key: key,
    })
  ) as Promise<{ Key: string; UploadId: string }>;
};

export const listParts = (key: string, uploadId: string) => {
  return createClient().send(
    new ListPartsCommand({
      ...commandConfig,
      Key: key,
      UploadId: uploadId,
    })
  );
};

export const prepareUploadParts = (
  key: string,
  uploadId: string,
  parts: number[]
) => {
  const client = createClient();

  return Promise.all(
    parts.map((number) =>
      getSignedUrl(
        client,
        new UploadPartCommand({
          ...commandConfig,
          Key: key,
          UploadId: uploadId,
          PartNumber: number,
        }),
        { expiresIn: 300 }
      )
    )
  );
};

export const completeMultipartUpload = (
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
) => {
  return createClient().send(
    new CompleteMultipartUploadCommand({
      ...commandConfig,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    })
  );
};

export const abortMultipartUpload = (key: string, uploadId: string) => {
  return createClient().send(
    new AbortMultipartUploadCommand({
      ...commandConfig,
      Key: key,
      UploadId: uploadId,
    })
  );
};
