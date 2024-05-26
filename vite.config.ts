import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

export default defineConfig({
  plugins: [remix(), tsconfigPaths()],
  optimizeDeps: {
    exclude: ["@node-rs/argon2-darwin-arm64", "@node-rs/bcrypt-darwin-arm64"] 
  },
});
