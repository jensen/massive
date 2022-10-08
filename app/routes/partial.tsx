import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import {
  listMultipartUploads,
  listParts,
  abortMultipartUpload,
} from "~/services/storage.server";
import Button from "~/components/shared/Button";

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

  uploads.sort((a, b) => {
    if (a?.Initiated && b?.Initiated) {
      return b.Initiated.getTime() - a.Initiated.getTime();
    }

    return 0;
  });

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

  return redirect("/partial");
};

function Empty() {
  return (
    <div className="p-4 border rounded-md">
      <span className="text-slate-700">No incomplete multipart uploads.</span>
    </div>
  );
}

function format(date?: string) {
  if (date === undefined) {
    throw new Error("Must provide date");
  }

  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );

  const intervals = [
    {
      label: "year",
      seconds: 365 * 24 * 60 * 60,
    },
    {
      label: "month",
      seconds: 30 * 24 * 60 * 60,
    },
    {
      label: "day",
      seconds: 24 * 60 * 60,
    },
    {
      label: "hour",
      seconds: 60 * 60,
    },
    {
      label: "minute",
      seconds: 60,
    },
  ];

  for (const interval of intervals) {
    const time = Math.floor(seconds / interval.seconds);

    if (time >= 1) {
      return `${time} ${interval.label}${time > 1 ? "s" : ""}`;
    }
  }

  return `${seconds} seconds`;
}

export default function Uploads() {
  const { uploads } = useLoaderData<Awaited<typeof loader>>();

  return (
    <section className="flex flex-col space-y-4 items-center">
      {uploads.length === 0 ? (
        <Empty />
      ) : (
        <Form className="w-96 space-y-4" method="post">
          <ul className="space-y-4">
            {uploads.map(
              (upload) =>
                upload && (
                  <li key={upload.UploadId} className="flex flex-col space-y-1">
                    <span className="text-sm">{upload.Key}</span>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        {`Created ${format(upload.Initiated)} ago`}
                      </span>
                      {upload.Parts && (
                        <span className="text-xs text-gray-400">
                          {upload.Parts.length} parts completed
                        </span>
                      )}
                    </div>
                  </li>
                )
            )}
          </ul>
          <Button>Delete All</Button>
        </Form>
      )}
    </section>
  );
}
