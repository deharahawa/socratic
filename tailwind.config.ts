import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/**
 * Tema Dark Sci-Fi — Pitch Black + acentos por modo (XP, Discovery, Hands-on, NOC).
 * Valores alinhados a emerald-500, purple-500, blue-500 e red-500 do Tailwind.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          void: "#050505",
          /** Sucesso / XP — emerald-500 */
          xp: "#10b981",
          /** Discovery Mode — purple-500 */
          discovery: "#a855f7",
          /** Hands-on Mode — blue-500 */
          handsOn: "#3b82f6",
          /** NOC / Incidentes — red-500 */
          noc: "#ef4444",
        },
      },
      backgroundColor: {
        canvas: "#050505",
      },
      backgroundImage: {
        "forge-radial":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168, 85, 247, 0.12), transparent)",
      },
      boxShadow: {
        "forge-glow-emerald": "0 0 40px -10px rgba(16, 185, 129, 0.35)",
        "forge-glow-purple": "0 0 40px -10px rgba(168, 85, 247, 0.35)",
        "forge-glow-blue": "0 0 40px -10px rgba(59, 130, 246, 0.35)",
        "forge-glow-red": "0 0 40px -10px rgba(239, 68, 68, 0.35)",
      },
    },
  },
  plugins: [typography],
};

export default config;
