import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { completeMultipartUpload } from "~/services/storage.server";

export const action = async ({ request, params }: ActionArgs) => {
  const body = await request.json();
  const completed = await completeMultipartUpload(
    body.key,
    body.uploadId,
    body.parts
  );

  return json({
    location: completed.Location,
  });
};
