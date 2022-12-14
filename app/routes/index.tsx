import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { selectObjects } from "~/services/db.server";
import { readableFileSize } from "~/utils/file";

export const loader = async () => {
  const objects = await selectObjects();

  return json({
    objects: objects.map((object) => ({
      ...object,
      size: Number(object.size),
    })),
  });
};

export default function Index() {
  const { objects } = useLoaderData<{
    objects: {
      id: string;
      name: string;
      size: number;
    }[];
  }>();

  return (
    <section className="flex flex-col space-y-4">
      <ul>
        {objects.map((object) => {
          return (
            <li key={object.id} className="text-gray-400">
              {object.name} {readableFileSize(object.size)}
            </li>
          );
        })}
      </ul>
      <div className="text-xl font-bold text-gray-500">
        {`Total Size ${readableFileSize(
          objects.reduce((sum, object) => sum + object.size, 0)
        )}`}
      </div>
    </section>
  );
}
