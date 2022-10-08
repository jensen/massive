import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import {
  getBucketCors,
  putBucketCors,
  deleteBucketCors,
} from "~/services/storage.server";
import Button from "~/components/shared/Button";

export const loader = async ({ request }: LoaderArgs) => {
  try {
    const cors = await getBucketCors();

    return json({
      cors,
      error: null,
    });
  } catch (error) {
    return json(
      {
        error: "CORS policy not found",
        cors: null,
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

function Empty() {
  return (
    <Form className="w-96 space-y-4" method="post">
      <textarea
        className="font-mono text-xs w-full"
        name="policy"
        rows={20}
      ></textarea>
      <Button>Save</Button>
    </Form>
  );
}

interface ExistingProps {
  value: string;
}

function Existing(props: ExistingProps) {
  return (
    <Form className="w-96 space-y-4" action="?delete" method="post">
      <pre className="text-xs">{props.value}</pre>
      <Button>Delete</Button>
    </Form>
  );
}

export default function Index() {
  const { cors, error } = useLoaderData<Awaited<typeof loader>>();

  return (
    <section className="flex flex-col items-center">
      {error ? (
        <Empty />
      ) : (
        <Existing
          value={JSON.stringify({ CORSRules: cors?.CORSRules }, null, 2)}
        />
      )}
    </section>
  );
}
