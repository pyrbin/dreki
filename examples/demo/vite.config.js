import { defineConfig } from "vite";
import svelte from "@sveltejs/vite-plugin-svelte";
import tailwind from "vite-plugin-tailwind";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwind()],
});
