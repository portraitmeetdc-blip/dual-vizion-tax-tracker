import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#ebf4ff",
          100: "#d6e8ff",
          200: "#adc8ff",
          300: "#84a9ff",
          400: "#5b89ff",
          500: "#1a365d",
          600: "#162d4e",
          700: "#12243f",
          800: "#0e1b30",
          900: "#0a1221",
        },
        gold: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#d69e2e",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
