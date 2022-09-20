interface MultipartUploadPart {
  PartNumber: number;
  ETag: string;
  Size: number;
}

interface MultipartUpload {
  Key: string;
  UploadId: string;
}

interface FileChunk {
  number: number;
  complete: boolean;
  ETag: string;
  data: Blob;
}

interface Upload {
  key: string;
  uploadId: string;
  complete: boolean;
  uploading: boolean;
  file: File;
  parts: MultipartUploadPart[];
}

interface ChunkProgress {
  number: number;
  loaded: number;
}
