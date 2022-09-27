import { rest } from "msw";
import { setupServer } from "msw/node";
import { handlers, baseUrl } from "./handlers";

export const server = setupServer(...handlers);

const mock = (method) => (path) => ({
  response: (data) =>
    server.use(
      rest[method](`${baseUrl}${path}`, (request, response, context) =>
        response(context.json(data))
      )
    ),
});

export const mockGet = mock("get");
export const mockPost = mock("post");
export const mockPut = mock("put");
export const mockDelete = mock("delete");
