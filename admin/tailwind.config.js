/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0A6E4E', light: '#12A376', dark: '#085C41' },
      },
    },
  },
  plugins: [],
}

