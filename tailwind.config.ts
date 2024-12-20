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
        'gris': '#BDBDBD',
        'color-soraya': '#bda86e',
        "color-soraya-2" :"#CFBD8C",
        "color-soraya-3": "#E3BB9B",
        "color-header": "#f8f8f8",
        "color-soraya-4": "#bda86e",
        "color-bordeau": "#4f2a11",
        "color-fond": "rgba(207, 189, 140, 0.2)",
        "color-white-soraya": "rgba(255, 255, 255, 0.5)",
        "color-black-soraya": "rgba(0, 0, 0, 0.8)"
      },
      width: {
        '600': '800px',
      },
      maxHeight: {
        '600': '600px',
      }
    },
  },
  plugins: [],
};
export default config;
