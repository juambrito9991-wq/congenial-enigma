import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        earth: "#6d4c1f",
        leaf: "#1f7a3d",
        sun: "#f2b705",
        river: "#0e7490",
        clay: "#b34d21"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(31, 122, 61, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
