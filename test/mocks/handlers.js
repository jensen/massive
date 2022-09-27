import { rest } from "msw";
export const baseUrl = "http://host";

export const handlers = [
  rest.get(
    `${baseUrl}/api/storage/listMultipartUploads`,
    (request, response, context) => {
      return response(
        context.status(200),
        context.json({
          Uploads: [],
        })
      );
    }
  ),
  rest.post(
    `${baseUrl}/api/storage/createMultipartUpload`,
    (request, response, context) => {
      return response(
        context.status(200),
        context.json({ uploadId: "uploadId-abc", key: "key-abc" })
      );
    }
  ),
  rest.post(
    `${baseUrl}/api/storage/prepareUploadParts`,
    (request, response, context) => {
      return response(
        context.status(200),
        context.json({
          presignedUrls: {
            1: "http://service/key.zip?partNumber=1&uploadId=abc",
          },
        })
      );
    }
  ),
  rest.post(
    `${baseUrl}/api/storage/completeMultipartUpload`,
    (request, response, context) => {
      return response(context.status(200), context.json({}));
    }
  ),
  rest.post(`${baseUrl}/api/storage/objects`, (request, response, context) => {
    return response(context.status(200), context.json({}));
  }),
];
