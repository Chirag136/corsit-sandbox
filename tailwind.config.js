/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#120C11",
        panel: "#1D1418",
        "panel-2": "#241A1F",
        maroon: "#7A1B2B",
        red: {
          DEFAULT: "#C13B3B",
          glow: "#C13B3B66",
        },
        plum: {
          DEFAULT: "#4B3358",
          light: "#6B4A78",
        },
        white: "#F1E9E4",
        muted: "#9C8B90",
        trace: "#3A2A2E",
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'pcb': '0 0 0 1px #3A2A2E',
        'glow-red': '0 0 25px 5px rgba(193, 59, 59, 0.45)',
        'glow-plum': '0 0 20px 2px rgba(75, 51, 88, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'wire-flow': 'wireFlow 1.5s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.08)' },
        },
        wireFlow: {
          '0%': { strokeDashoffset: '20' },
          '100%': { strokeDashoffset: '0' },
        }
      }
    },
  },
  plugins: [],
}
