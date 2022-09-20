import { Form } from "@remix-run/react";

import UploaderProvider, {
  useUploader,
  useFileUpload,
} from "~/context/uploader";

interface UploadListProps {
  upload: Upload;
}

const Upload = (props: UploadListProps) => {
  const { percentage } = useFileUpload(props.upload);

  return (
    <li>
      {props.upload.file.name} - {percentage}%
    </li>
  );
};

const UploadList = () => {
  const { uploads } = useUploader();

  return (
    <ul>
      {uploads.map((upload) => (
        <Upload key={upload.file.name} upload={upload} />
      ))}
    </ul>
  );
};

const FileUpload = () => {
  const { add, start } = useUploader();

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        start();
      }}
    >
      <input
        type="file"
        name="uploads"
        multiple
        onChange={(event) => {
          if (event.target.files) {
            add(Array.from(event.target.files));
          }
        }}
      />
      <button>Upload</button>
    </Form>
  );
};

export default function Uploader() {
  return (
    <UploaderProvider>
      <FileUpload />
      <UploadList />
    </UploaderProvider>
  );
}
