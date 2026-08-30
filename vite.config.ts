import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Raise warning threshold — individual page chunks will be well under 600 kB
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // ── Vendor: React core ──
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // ── Vendor: Charting (recharts is heavy) ──
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          // ── Vendor: PDF generation ──
          if (id.includes("node_modules/jspdf") || id.includes("node_modules/jspdf-autotable")) {
            return "vendor-pdf";
          }
          // ── Vendor: Google AI SDK ──
          if (id.includes("node_modules/@google/generative-ai")) {
            return "vendor-ai";
          }
          // ── Vendor: Supabase ──
          if (id.includes("node_modules/@supabase/")) {
            return "vendor-supabase";
          }
          // ── Vendor: Animation / motion ──
          if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          // ── Vendor: Remaining large node_modules ──
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
})
