import { beforeAll, afterEach, afterAll, expect } from "vitest";
import matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server.js";
import nodeFetch from "node-fetch";

expect.extend(matchers);

window.fetch = (input, init) => nodeFetch(new URL(input, "http://host"), init);

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});
