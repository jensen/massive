export const getFileExtension = (name: string) => {
  const index = name.lastIndexOf(".");

  if (index === -1) {
    throw new Error("Could not determine file extension");
  }

  return name.slice(index + 1);
};

export const generateUniqueFileId = (file: File) => {
  let id = "";

  if (typeof file.name === "string") {
    id += file.name.replace(/[^A-Z0-9]/gi, "-").toLowerCase();
  }

  if (file.type !== undefined) {
    id += `-${file.type}`;
  }

  if (file.size !== undefined) {
    id += `-${file.size}`;
  }

  if (file.lastModified !== undefined) {
    id += `-${file.lastModified}`;
  }

  return id;
};

export const encodeHash = async (file: File) => {
  const data = new TextEncoder().encode(generateUniqueFileId(file));
  const hash = await crypto.subtle.digest("sha-1", data);

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16))
    .join("");
};

export const generateFilename = async (file: File) => {
  const hash = await encodeHash(file);

  return `${hash}.${getFileExtension(file.name)}`;
};
