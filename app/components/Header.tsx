import { Link } from "@remix-run/react";

export default function Header() {
  return (
    <header className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
      <h2 className="font-bold text-xl">
        <Link to="/">massive uploader</Link>
      </h2>
      <nav>
        <ul className="flex space-x-2">
          <li className="border-r border-gray-200 pr-2">
            <Link className="link" to="cors">
              Configure CORS
            </Link>
          </li>
          <li>
            <Link className="link" to="partial">
              Partial Uploads
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
