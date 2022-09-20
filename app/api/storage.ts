function get<T, P = undefined>(url: string) {
  return (data?: P) =>
    fetch(
      `/api${url}${data ? "?" + new URLSearchParams(data).toString() : ""}`
    ).then((response) => response.json()) as T;
}

function post<T, P = undefined>(url: string) {
  return (data?: P) =>
    fetch(`/api${url}`, {
      method: "post",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      body: data && JSON.stringify(data),
    }).then((response) => response.json()) as T;
}

export const createMultipartUpload = post<
  { key: string; uploadId: string },
  { name: string }
>("/storage/createMultipartUpload");

export const prepareUploadParts = post<
  { presignedUrls: string[] },
  { key: string; uploadId: string; parts: number[] }
>("/storage/prepareUploadParts");

export const completeMultipartUpload = post<
  { location: string },
  { key: string; uploadId: string; parts: MultipartUploadPart[] }
>("/storage/completeMultipartUpload");

export const listMultipartUploads = get<{ uploads: MultipartUpload[] }>(
  "/storage/listMultipartUploads"
);

export const listParts = get<
  { parts: MultipartUploadPart[] },
  { key: string; uploadId: string }
>("/storage/listParts");
