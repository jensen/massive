import { useState, useEffect } from "react";

interface DownloadProps {
  filename: string;
}

export default function Download(props: DownloadProps) {
  const [progress, setProgress] = useState(0);

  const { filename } = props;

  useEffect(() => {
    const xhr = new XMLHttpRequest();

    xhr.open("GET", "https://", true);

    xhr.responseType = "blob";

    xhr.onprogress = (event) =>
      setProgress(Math.round((event.loaded / event.total) * 100));

    xhr.onload = () => {
      if (xhr.status === 200) {
        const url = URL.createObjectURL(xhr.response);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;

        document.body.appendChild(a).click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
      }
    };

    xhr.send();

    return () => {
      xhr.abort();
    };
  }, [filename]);

  return (
    <div className="w-full">
      <div className="h-2 bg-blue-400" style={{ width: `${progress}%` }}></div>
    </div>
  );
}
