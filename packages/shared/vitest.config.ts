import { defineConfig } from "vitest/config";

export default defineConfig({
  // Source uses NodeNext-style ".js" import specifiers that point to ".ts" files;
  // map them so Vitest resolves them the same way tsx/tsc do.
  resolve: { extensionAlias: { ".js": [".ts", ".js"] } },
});
