/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quest: {
          bg: '#090d16',
          card: '#111726',
          border: '#1f293d',
          gold: '#f59e0b',
          purple: '#8b5cf6',
          blue: '#38bdf8',
          green: '#10b981',
          crimson: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px -5px rgba(245, 158, 11, 0.3)',
        'glow-purple': '0 0 20px -5px rgba(139, 92, 246, 0.3)',
        'glow-blue': '0 0 20px -5px rgba(56, 189, 248, 0.3)',
      }
    },
  },
  plugins: [],
}
