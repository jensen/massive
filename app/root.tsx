import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import Page from "~/components/layout/Page";
import Uploader from "~/components/Uploader";

import { useRefetchData } from "~/api/data";

import styles from "~/styles/app.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Massive Uploader",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  const refresh = useRefetchData();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Uploader refresh={refresh} />
        <Page />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
