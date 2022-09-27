import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import Uploader from "~/components/Uploader";
import { mockPost } from "../mocks/server";

vi.mock("@remix-run/react", () => {
  return {
    Form: vi.fn((props) => {
      return <form onSubmit={props.onSubmit}>{props.children}</form>;
    }),
  };
});

describe("Uploader Component", () => {
  const original = {};

  beforeAll(() => {
    window.crypto = {
      subtle: {
        digest: (type, data) => "abc",
      },
    };

    original.XMLHttpRequest = window.XMLHttpRequest;
  });

  afterEach(() => {
    window.XMLHttpRequest = original.XMLHttpRequest;
  });

  it("it allows user to add files", async () => {
    render(<Uploader />);

    await userEvent.upload(
      screen.getByLabelText("Add Files"),
      new File(["abc"], "filename.txt", { type: "text/plain" })
    );

    expect(await screen.findByText("filename.txt")).toBeInTheDocument();
  });

  it("it allows user to upload added files", async () => {
    window.XMLHttpRequest = vi.fn(() => {
      const instance = {
        status: 200,
        open: vi.fn(),
        send: vi.fn(() => {
          instance.upload.onprogress({
            loaded: 3,
          });
          instance.onload({
            target: {
              getResponseHeader: () => "abc",
            },
          });
        }),
        upload: vi.fn(),
      };

      return instance;
    });

    render(<Uploader />);

    await userEvent.upload(
      screen.getByLabelText("Add Files"),
      new File(["abc"], "filename.txt", { type: "text/plain" })
    );

    await fireEvent.click(await screen.findByText("Begin Upload"));

    await waitForElementToBeRemoved(() => screen.getByText("0%"));

    expect(screen.getByText("100%")).toBeInTheDocument();

    await screen.findByText("Complete");
  });

  describe("retrying", () => {
    it("retries a file when there is an error", async () => {
      const state = {
        retry: 0,
      };

      window.XMLHttpRequest = vi.fn(() => {
        const instance = {
          open: vi.fn(),
          send: vi.fn(() => {
            if (state.retry < 1) {
              instance.status = 400;
              instance.onerror({});
              state.retry++;
            } else {
              instance.status = 200;
              instance.upload.onprogress({
                loaded: 3,
              });
              instance.onload({
                target: {
                  getResponseHeader: () => "abc",
                },
              });
            }
          }),
          upload: vi.fn(),
        };

        return instance;
      });

      render(<Uploader />);

      await userEvent.upload(
        screen.getByLabelText("Add Files"),
        new File(["abc"], "filename.txt", { type: "text/plain" })
      );

      await fireEvent.click(await screen.findByText("Begin Upload"));

      await waitForElementToBeRemoved(() => screen.getByText("0%"));

      expect(screen.getByText("100%")).toBeInTheDocument();

      await screen.findByText("Complete");
    });

    it("retries 3 times and then fails completely", async () => {
      const urls = new Array(5)
        .fill(null)
        .map(
          (url, index) =>
            `http://service/key.zip?partNumber=${index + 1}&uploadId=abc`
        );

      mockPost("/api/storage/prepareUploadParts").response({
        presignedUrls: urls.reduce((urls, url, index) => {
          urls[index + 1] = url;
          return urls;
        }, {}),
      });

      const instances = [];

      window.XMLHttpRequest = vi.fn(() => {
        const instance = {
          open: vi.fn(),
          send: vi.fn(() => {
            instance.upload.onprogress({
              loaded: 3 * 1024 * 1024,
            });
            instance.status = 400;
            instance.onerror({});
          }),
          upload: vi.fn(),
        };

        instances.push(instance);

        return instance;
      });

      render(<Uploader />);

      await userEvent.upload(
        screen.getByLabelText("Add Files"),
        new File([new Int8Array(32 * 1024 * 1024)], "filename.txt", {
          type: "text/plain",
        })
      );

      await fireEvent.click(await screen.findByText("Begin Upload"));

      await waitForElementToBeRemoved(() => screen.getByText("0%"));

      expect(screen.getByText("47%")).toBeInTheDocument();

      await screen.findByText("Incomplete");

      const openCalls = instances.map((i) => i.open.calls[0][1]);

      expect(openCalls).toHaveLength(20);

      expect(
        urls
          .map((url) => openCalls.filter((call) => call === url).length === 4)
          .every(Boolean)
      ).toBe(true);
    });
  });
});
