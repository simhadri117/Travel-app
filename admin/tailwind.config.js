/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0F0F1A',
          secondary: '#1A1A2E',
        },
        accent: {
          primary: '#FF6B6B',
          secondary: '#FFD93D',
        },
        success: '#43E97B',
        info: '#4FACFE',
        purple: '#845EC2'
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        sans: ['Nunito', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
