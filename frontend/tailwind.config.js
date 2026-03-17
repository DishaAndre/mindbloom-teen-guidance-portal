/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Lora"', 'serif'],
      },
      colors: {
        teal: {
          50:  '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4',
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6',
          600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a',
        },
      },
      boxShadow: {
        'card':  '0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .04)',
        'lift':  '0 10px 30px -5px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .05)',
        'glow':  '0 0 0 3px rgb(13 148 136 / .15)',
      },
    },
  },
  plugins: [],
}
