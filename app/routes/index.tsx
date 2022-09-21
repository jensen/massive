import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { listObjects } from "~/services/storage.server";
import { readableFileSize } from "~/utils/file";

export const loader = async () => {
  const objects = (await listObjects()).Contents || [];

  return json({
    objects,
  });
};

export default function Index() {
  const { objects } = useLoaderData<{
    objects: {
      Key: string;
      Size: number;
    }[];
  }>();

  return (
    <div>
      <ul className="p-4">
        {objects.map((object) => {
          return (
            <li key={object.Key} className="text-gray-400">
              {object.Key} {readableFileSize(object.Size)}
            </li>
          );
        })}
      </ul>
      <div className="px-4 text-xl font-bold text-gray-500">
        Total Size:{" "}
        {readableFileSize(
          objects.reduce((sum, object) => sum + object.Size, 0)
        )}
      </div>
    </div>
  );
}
