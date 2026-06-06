import { defineConfig } from "vitest/config";

export default defineConfig({
  // Map NodeNext ".js" specifiers to their ".ts" sources for resolution.
  resolve: { extensionAlias: { ".js": [".ts", ".js"] } },
});
