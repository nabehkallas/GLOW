/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        prima: {
          dark:   '#263238',
          orange: '#e8481c',
          green:  '#2db563',
          light:  '#f4f6f5',
        },
      },
    },
  },
  plugins: [],
}
