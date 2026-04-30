/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,css}"],
  theme: {
    extend: {
      screens: {
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
      },
      animation: {
        slideUp: "slideUp 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
