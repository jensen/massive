import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  createMultipartUpload,
  prepareUploadParts,
  completeMultipartUpload,
  listMultipartUploads,
  listParts,
} from "~/services/storage.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  if (params.cb === "listMultipartUploads") {
    return json({
      uploads: (await listMultipartUploads()).Uploads,
    });
  }

  if (params.cb === "listParts") {
    const url = new URL(request.url);

    const key = url.searchParams.get("key");
    const uploadId = url.searchParams.get("uploadId");

    if (key && uploadId) {
      return json({
        parts: (await listParts(key, uploadId)).Parts,
      });
    }
  }

  return new Response(null, { status: 400 });
};

export const action = async ({ request, params }: ActionArgs) => {
  const body = await request.json();

  if (params.cb === "createMultipartUpload") {
    const upload = await createMultipartUpload(body.name);

    return json({
      uploadId: upload.UploadId,
      key: upload.Key,
    });
  }

  if (params.cb === "prepareUploadParts") {
    const urls = await prepareUploadParts(body.key, body.uploadId, body.parts);
    console.log(urls);
    const presignedUrls = urls.reduce((urls, url, index) => {
      urls[body.parts[index]] = url;
      return urls;
    }, {} as { [key: string]: string });

    console.log(presignedUrls);
    return json({
      presignedUrls,
    });
  }

  if (params.cb === "completeMultipartUpload") {
    const completed = await completeMultipartUpload(
      body.key,
      body.uploadId,
      body.parts
    );

    return json({
      location: completed.Location,
    });
  }

  return new Response(null, { status: 400 });
};
