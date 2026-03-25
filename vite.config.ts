import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const wordpressApiBase =
    env.VITE_WORDPRESS_API_URL ||
    env.VITE_WORDPRESS_API_BASE_URL ||
    "http://localhost/wp-json/kanna/v1";
  const wordpressTarget = (() => {
    try {
      return new URL(wordpressApiBase).origin;
    } catch {
      return "http://localhost";
    }
  })();

  return {
    base: "/",
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    server: {
      proxy: {
        "/wp-json": {
          changeOrigin: true,
          target: wordpressTarget,
        },
      },
    },
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

            if (id.includes("/motion/")) {
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
  };
});
