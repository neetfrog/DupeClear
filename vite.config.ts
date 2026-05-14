import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: "public/electron.ts",
        onstart(options) {
          if (process.env.ELECTRON_DEV !== "true") {
            options.startup();
          }
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              output: {
                entryFileNames: "main.js",
              },
              external: Object.keys("module" in process ? require("module").builtinModules : {}),
            },
          },
        },
      },
      {
        entry: "public/preload.ts",
        onstart(options) {
          // Preload scripts don't need startup
        },
        vite: {
          build: {
            lib: {
              entry: path.resolve(__dirname, "public/preload.ts"),
              formats: ["cjs"],
            },
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"],
              output: {
                entryFileNames: "preload.js",
              },
            },
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      external: Object.keys("module" in process ? require("module").builtinModules : {}),
    },
  },
});
