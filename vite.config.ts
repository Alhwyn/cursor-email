import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  publicDir: "public",
  server: {
    port: 3010,
    strictPort: true,
  },
  preview: {
    port: 3010,
    strictPort: true,
  },
  // SPA fallback so /guests, /crm, and /:uuid serve index.html
  appType: "spa",
});
