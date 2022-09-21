import { Form } from "@remix-run/react";

import UploaderProvider, {
  useUploader,
  useFileUpload,
} from "~/context/uploader";

import { AddFileIcon, UploadIcon } from "~/components/shared/Icons";
import Button from "~/components/shared/Button";

interface UploadListProps {
  upload: Upload;
}

const Upload = (props: UploadListProps) => {
  const { percentage, ready, speed } = useFileUpload(props.upload);

  return (
    <li
      className={`px-4 py-2 border rounded-md ${
        props.upload.uploading ? "border-gray-400" : "border-gray-200"
      }`}
    >
      <div className="text-gray-800">{props.upload.file.name}</div>
      <div className="flex justify-between items-end">
        {speed.calculating ? (
          <span className="text-sm text-gray-400">
            Calculating upload speed
          </span>
        ) : (
          <span className="text-md text-gray-600">
            {speed.raw > 0 && speed.readable}&nbsp;
          </span>
        )}
        <span>{ready && `${percentage}%`}&nbsp;</span>
      </div>
    </li>
  );
};

const UploadList = () => {
  const { uploads } = useUploader();

  if (uploads.length === 0) return null;

  return (
    <div className="p-4 space-y-4">
      <ul className="overflow-y-scroll max-h-96 space-y-2">
        {uploads.map((upload) => (
          <Upload key={upload.file.name} upload={upload} />
        ))}
      </ul>
    </div>
  );
};

const FileUpload = () => {
  const { add, start, uploads } = useUploader();

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        start();
      }}
      className="w-full"
    >
      <UploadList />
      <div className="p-4 space-y-1">
        {uploads.length > 0 && (
          <Button>
            <UploadIcon />
            <span>Begin Upload</span>
          </Button>
        )}
        <label className="block w-full">
          <div className="button" role="button">
            <AddFileIcon />
            <span>Add Files</span>
          </div>
          <input
            type="file"
            name="uploads"
            multiple
            onChange={(event) => {
              if (event.target.files && event.target.files.length > 0) {
                add(Array.from(event.target.files));
              }
            }}
            className="hidden"
          />
        </label>
      </div>
    </Form>
  );
};

export default function Uploader() {
  return (
    <section className="w-96 shadow-md fixed right-2 bottom-2 border border-gray-200 bg-gray-50 rounded-md hover:border-gray-300">
      <UploaderProvider>
        <FileUpload />
      </UploaderProvider>
    </section>
  );
}
