import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
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
