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
        brand: {
          50: "#fef3f2",
          100: "#ffe4e1",
          500: "#f04e37",
          600: "#dc3220",
          700: "#b9251a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
