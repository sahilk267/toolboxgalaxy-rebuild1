import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import { isValidRoute } from "./shared/routeValidator";

function dev404Plugin(): Plugin {
  return {
    name: "dev-404-status",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "/";
        const pathname = url.split("?")[0];

        // Bypass Vite internals, client assets, HMR, and files with extensions
        if (
          pathname.startsWith("/@") ||
          pathname.startsWith("/src/") ||
          pathname.startsWith("/node_modules/") ||
          pathname.startsWith("/api/") ||
          pathname.startsWith("/.well-known/") ||
          pathname.startsWith("/assets/") ||
          pathname.startsWith("/models/") ||
          pathname.startsWith("/licenses/") ||
          /\.(?:js|mjs|ts|tsx|css|png|jpg|jpeg|gif|svg|ico|json|woff2?|ttf|map|xml|txt|webmanifest)$/i.test(pathname)
        ) {
          return next();
        }

        // Only intercept GET / HEAD document requests
        if (req.method !== "GET" && req.method !== "HEAD") {
          return next();
        }

        if (!isValidRoute(pathname)) {
          res.statusCode = 404;

          const acceptHeader = (req.headers.accept || "").toLowerCase();
          if (acceptHeader.includes("text/markdown") || acceptHeader.includes("text/x-markdown")) {
            res.setHeader("Content-Type", "text/markdown; charset=utf-8");
            res.end(`# 404 - Not Found\n\nThe requested resource \`${pathname}\` was not found on Toolbox Galaxy.`);
            return;
          }

          try {
            const indexPath = path.resolve(server.config.root, "index.html");
            let html = fs.readFileSync(indexPath, "utf-8");
            html = await server.transformIndexHtml(url, html);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(html);
            return;
          } catch (e) {
            return next(e);
          }
        }

        return next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dev404Plugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@babylonjs")) return "babylon";
          if (id.includes("three")) return "three";
          if (id.includes("pdfjs-dist")) return "pdfjs";
          if (id.includes("docx")) return "docx";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@radix-ui")) return "radix";
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: false,
    },
  },
});
