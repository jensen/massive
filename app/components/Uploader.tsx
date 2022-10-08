import { useState, useRef } from "react";
import { Form } from "@remix-run/react";
import UploaderProvider, {
  useUploader,
  useFileUpload,
  useRemoveFile,
} from "~/context/uploader";

import {
  AddFileIcon,
  UploadIcon,
  RemoveIcon,
  ConfirmIcon,
  CancelIcon,
} from "~/components/shared/Icons";
import Button from "~/components/shared/Button";

interface ConfirmRemoveProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmRemove = (props: ConfirmRemoveProps) => {
  return (
    <div className="group border border-rose-400 hover:border-rose-700 bg-white absolute w-full h-full rounded-md flex flex-col justify-center items-center space-y-2">
      <span className="text-rose-400 group-hover:text-rose-400">
        Are you sure you want to remove this file?
      </span>
      <div className="flex space-x-2 text-rose-400 ">
        <button
          className="hover:text-rose-700"
          type="button"
          onClick={props.onConfirm}
        >
          <ConfirmIcon />
        </button>
        <button
          className="hover:text-rose-700"
          type="button"
          onClick={props.onCancel}
        >
          <CancelIcon />
        </button>
      </div>
    </div>
  );
};

interface UploadProps {
  upload: Upload;
}

const Upload = (props: UploadProps) => {
  const { percentage, ready, speed } = useFileUpload(props.upload);
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <li
      className={`border rounded-md relative ${
        props.upload.uploading ? "border-gray-400" : "border-gray-200"
      }`}
    >
      {showConfirmation && (
        <ConfirmRemove
          onConfirm={() => {
            props.upload.remove();
            setShowConfirmation(false);
          }}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
      <div className="pl-2 pt-2 pr-2 flex justify-between space-x-4">
        <span className="text-gray-800 text-sm">{props.upload.file.name}</span>
        <span className="pr-1 pt-1">
          <button
            type="button"
            className="text-gray-400 hover:text-rose-700"
            onClick={() => setShowConfirmation(true)}
          >
            <RemoveIcon />
          </button>
        </span>
      </div>
      <div className="pl-2 pb-2 pr-2 flex justify-between items-end">
        {speed.calculating ? (
          <span className="text-sm text-gray-400">
            Calculating upload speed
          </span>
        ) : (
          <span className="text-md text-gray-600">
            {props.upload.error
              ? "Incomplete"
              : props.upload.complete
              ? "Complete"
              : speed.raw > 0
              ? speed.readable
              : ""}
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { add, start, uploads } = useUploader();

  const remove = useRemoveFile(inputRef);

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
            ref={inputRef}
            type="file"
            name="uploads"
            multiple
            onChange={(event) => {
              if (event.target.files && event.target.files.length > 0) {
                add(Array.from(event.target.files), remove);
              }
            }}
            className="hidden"
          />
        </label>
      </div>
    </Form>
  );
};

interface UploaderProps {
  refresh: () => void;
}

export default function Uploader(props: UploaderProps) {
  return (
    <section className="w-128 shadow-md fixed right-2 bottom-2 border border-gray-200 bg-gray-50 rounded-md hover:border-gray-300">
      <UploaderProvider refresh={props.refresh}>
        <FileUpload />
      </UploaderProvider>
    </section>
  );
}
