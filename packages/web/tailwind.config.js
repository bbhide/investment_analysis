/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // The Excel "light brown" input cells — used to highlight editable fields
        brown: {
          50: '#fdf8f3',
          100: '#f6e7d0',
          200: '#ecd0a3',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
