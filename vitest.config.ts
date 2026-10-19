import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root.replace(/[\\/]+$/, ""),
      // lib/{money,apiAuth,supabaseAdmin,...}.ts import the Next-only
      // `server-only` marker, which throws when there is no react-server
      // condition. The test runner is a plain node process, so point it at an
      // empty module instead of pulling in the Next runtime.
      "server-only": `${root}tests/stubs/server-only.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      // supabaseAdmin throws at import when the secret key is missing; the
      // tests below never issue a query, they only need the module to load.
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_vitest_placeholder",
      WHATSAPP_APP_SECRET: "vitest_app_secret",
    },
  },
});
