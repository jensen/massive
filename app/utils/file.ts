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
    .map((b) => {
      const hex = b.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join("");
};

export const generateFilename = async (file: File) => {
  const hash = await encodeHash(file);

  return `${hash}.${getFileExtension(file.name)}`;
};

export const readableFileSize = (size: number) => {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  let i = 0;

  while (size >= 1024) {
    size /= 1024;
    ++i;
  }

  return [size.toFixed(2).replace(".00", ""), units[i]].join(" ");
};
