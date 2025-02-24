import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { fileURLToPath, URL } from "node:url";
import { resolve } from "path";
import { writeFileSync, copyFileSync, mkdirSync, existsSync } from "fs";

const copyExtensionFiles = () => {
  return {
    name: "copy-extension-files",
    closeBundle() {
      const createDir = (dir) => {
        try {
          mkdirSync(dir, { recursive: true });
        } catch (err) {
          if (err.code !== "EEXIST") throw err;
        }
      };

      const copyFile = (src, dest) => {
        try {
          if (existsSync(src)) {
            copyFileSync(src, dest);
            console.log(`Copied ${src} to ${dest}`);
          } else {
            console.warn(`Source file not found: ${src}`);
          }
        } catch (err) {
          console.error(`Error copying ${src} to ${dest}:`, err);
        }
      };

      // Create necessary directories
      createDir("dist/icons");

      // Copy extension files
      const filesToCopy = [
        ["src/manifest.json", "dist/manifest.json"],
        ["src/app.html", "dist/app.html"],
        ["src/content.css", "dist/content.css"],
        ["src/background.js", "dist/background.js"],
        ["src/content.js", "dist/content.js"],
        ["src/icons/icon16.png", "dist/icons/icon16.png"],
        ["src/icons/icon48.png", "dist/icons/icon48.png"],
        ["src/icons/icon128.png", "dist/icons/icon128.png"],
      ];

      filesToCopy.forEach(([src, dest]) => copyFile(src, dest));
    },
  };
};

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true }), copyExtensionFiles()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, "src/app.js"),
      },
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        dir: "dist",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
  },
});
