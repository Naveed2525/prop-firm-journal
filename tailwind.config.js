/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0A0A0F',
        },
      },
    },
  },
  plugins: [],
};
