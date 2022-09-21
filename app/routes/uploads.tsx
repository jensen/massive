import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import {
  listMultipartUploads,
  listParts,
  abortMultipartUpload,
} from "~/services/storage.server";

export const loader = async () => {
  const { Uploads } = await listMultipartUploads();

  const uploads = Uploads
    ? await Promise.all(
        Uploads.map((upload) => {
          if (upload.Key && upload.UploadId) {
            return listParts(upload.Key, upload.UploadId).then(({ Parts }) => ({
              ...upload,
              Parts,
            }));
          }

          return Promise.resolve(null);
        })
      )
    : [];

  return json({
    uploads,
  });
};

export const action = async () => {
  const { Uploads } = await listMultipartUploads();

  if (Uploads) {
    await Promise.all(
      Uploads?.map((upload) => {
        if (upload.Key && upload.UploadId) {
          return abortMultipartUpload(upload.Key, upload.UploadId);
        }

        return Promise.resolve(null);
      })
    );
  }

  return redirect("/uploads");
};

export default function Uploads() {
  const { uploads } = useLoaderData<{
    uploads: { Key: string; UploadId: string; Parts: any[] }[];
  }>();

  return (
    <>
      <ul>
        {uploads.map((upload) => (
          <li key={upload.UploadId}>
            {upload.Key} - {upload.Parts?.length}
          </li>
        ))}
      </ul>
      <Form method="post">
        <button>Delete</button>
      </Form>
    </>
  );
}
