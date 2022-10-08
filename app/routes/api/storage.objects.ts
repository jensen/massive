import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createObject } from "~/services/db.server";

export const action = async ({ request }: ActionArgs) => {
  const body = await request.json();

  if (
    body.id === null ||
    body.name === null ||
    body.type === null ||
    body.size === null
  ) {
    throw new Response(null, { status: 400 });
  }

  const id = body.id as string;
  const name = body.name as string;
  const type = (body.type as string) || "application/octet-stream";
  const size = BigInt(body.size as string);

  const object = await createObject({ id, name, type, size });

  return json({ object: { ...object, size: Number(object.size) } });
};
