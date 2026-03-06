/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#38BDF8",
        accent: "#34D399",
        bg: "#F9FAFB",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        borderLight: "#E5E7EB",
      },
    },
  },
  plugins: [],
};
