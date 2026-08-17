import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Standalone-Variante ("Zwischenschritt"): läuft komplett ohne Backend auf 5174.
// Alle Daten kommen aus dem Mock-Client in src/lib/api.ts — kein /api-Proxy.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Nur Typ-Schemas (zod) — reine Build-Zeit-Abhängigkeit, kein Backend.
      "@icp/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});
