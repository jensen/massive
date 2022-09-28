import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { listParts } from "~/services/storage.server";

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);

  const key = url.searchParams.get("key");
  const uploadId = url.searchParams.get("uploadId");

  if (key && uploadId) {
    return json({
      parts: (await listParts(key, uploadId)).Parts,
    });
  }

  return new Response(null, { status: 400 });
};
