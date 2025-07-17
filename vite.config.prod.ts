import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Production-optimized Vite configuration for deployment
export default defineConfig({
  plugins: [
    react({
      // Disable fast refresh in production to avoid transform issues
      fastRefresh: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Optimize build for deployment environment
    minify: "terser",
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
    },
    // Reduce memory usage during build
    chunkSizeWarningLimit: 1000,
    // Disable sourcemaps in production to speed up build
    sourcemap: false,
  },
  server: {
    fs: {
      strict: false, // Allow more flexible file access in deployment
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ["react", "react-dom", "wouter"],
    force: true,
  },
  // Set build mode explicitly
  mode: "production",
});