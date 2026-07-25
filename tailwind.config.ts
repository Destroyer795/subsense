import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F0EA",
        surface: "#FFFFFF",
        critical: "#FF3366",
        warning: "#FFDE59",
        safe: "#00E676",
        accent: "#3366FF",
        dark: "#000000",
      },
      boxShadow: {
        "brutal-sm": "2px 2px 0px 0px rgba(0,0,0,1)",
        brutal: "4px 4px 0px 0px rgba(0,0,0,1)",
        "brutal-lg": "8px 8px 0px 0px rgba(0,0,0,1)",
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
