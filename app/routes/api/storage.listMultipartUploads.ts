import { json } from "@remix-run/node";
import { listMultipartUploads } from "~/services/storage.server";

export const loader = async () => {
  return json({
    uploads: (await listMultipartUploads()).Uploads,
  });
};
