import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        majalis: {
          green: "#1F3D2B",
          greenLight: "#EAF0E6",
          beige: "#F4EFE3",
          card: "#FBF8F0",
          gold: "#B8925A",
          goldSoft: "#EFE1CB",
          ink: "#20261E",
        },
      },
      fontFamily: {
        display: ["Amiri", "serif"],
        body: ["Cairo", "IBM Plex Sans Arabic", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
