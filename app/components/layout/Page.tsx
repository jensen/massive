import { Outlet } from "@remix-run/react";
import Header from "~/components/Header";

export default function Page() {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-grow pt-12 px-4">
        <Outlet />
      </main>
    </div>
  );
}
