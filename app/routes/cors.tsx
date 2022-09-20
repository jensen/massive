import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import {
  getBucketCors,
  putBucketCors,
  deleteBucketCors,
} from "~/services/storage.server";

export const loader = async ({ request }: LoaderArgs) => {
  try {
    const cors = await getBucketCors();

    return json({
      cors,
    });
  } catch (error) {
    return json(
      {
        error: "CORS policy not found",
      },
      {
        status: 404,
      }
    );
  }
};

export const action = async ({ request }: ActionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("delete") !== null) {
    await deleteBucketCors();
  } else {
    const body = await request.formData();

    await putBucketCors(body.get("policy") as string);
  }

  return redirect("/cors");
};

export default function Index() {
  const data = useLoaderData();

  if (data.error) {
    return (
      <Form method="post">
        <textarea name="policy" rows={20}></textarea>
        <button>Submit</button>
      </Form>
    );
  }

  return (
    <>
      <pre>{JSON.stringify(data.cors.CORSRules, null, 2)}</pre>
      <Form action="?delete" method="post">
        <button>Delete</button>
      </Form>
    </>
  );
}
