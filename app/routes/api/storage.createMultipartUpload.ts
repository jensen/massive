import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createMultipartUpload } from "~/services/storage.server";

export const action = async ({ request }: ActionArgs) => {
  const body = await request.json();
  const upload = await createMultipartUpload(body.name);

  return json({
    uploadId: upload.UploadId,
    key: upload.Key,
  });
};
