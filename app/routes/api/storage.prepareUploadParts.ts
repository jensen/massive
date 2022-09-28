import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prepareUploadParts } from "~/services/storage.server";

export const action = async ({ request }: ActionArgs) => {
  const body = await request.json();
  const urls = await prepareUploadParts(body.key, body.uploadId, body.parts);

  const presignedUrls = urls.reduce((urls, url, index) => {
    urls[body.parts[index]] = url;
    return urls;
  }, {} as { [key: string]: string });

  return json({
    presignedUrls,
  });
};
