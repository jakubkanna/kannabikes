import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  base: "/",
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "react";
          }

          if (
            id.includes("/react-router/") ||
            id.includes("/@react-router/")
          ) {
            return "router";
          }

          if (
            id.includes("/motion/")
          ) {
            return "order-motion";
          }

          if (
            id.includes("/country-state-city/") ||
            id.includes("/validator/")
          ) {
            return "shipping-data";
          }
        },
      },
    },
  },
}));
