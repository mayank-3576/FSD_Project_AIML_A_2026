/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        abes: {
          navy: '#0b192c',
          blue: '#1e3e62',
          orange: '#ff6500',
          dark: '#000000',
          light: '#f5f7fa',
        }
      }
    },
  },
  plugins: [],
}
