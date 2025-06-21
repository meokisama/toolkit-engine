import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: "assets",
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __ELECTRON_VERSION__: JSON.stringify(packageJson.devDependencies.electron),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleString()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
