import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  test: {
    environment: "jsdom",
    alias: {
      "~": "../../app",
    },
    include: ["**/test/ui/*.jsx"],
    setupFiles: ["./test/setup.js"],
  },
  plugins: [react()],
});
