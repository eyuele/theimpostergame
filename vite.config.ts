import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import geo from "vite-plugin-geo"; // 1. Import the plugin

export default defineConfig({
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        geo({
            domain: "https://theimpostorup.vercel.app", // 2. Add your actual domain here
        }),
    ],
    server: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:4479",
                changeOrigin: true,
                ws: true,
            },
        },
    },
});
