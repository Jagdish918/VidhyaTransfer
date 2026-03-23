export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        cyan: {
          400: '#60a5fa', // blue-400
          500: '#3b82f6', // blue-500
          600: '#2563eb', // blue-600
          900: '#1e3a8a', // blue-900
        },
        dark: {
          // NOTE: These tokens are used widely via classes like `bg-dark-bg`.
          // We keep the names to avoid touching component logic, but map them to a clean light theme.
          bg: '#f8fafc', // slate-50 (app background)
          card: '#ffffff', // white (surface)
          border: '#e2e8f0', // slate-200 (borders/dividers)
          hover: '#f1f5f9', // slate-100 (subtle hover fill)
        }
      },
      boxShadow: {
        'soft': '0 8px 30px -12px rgba(15, 23, 42, 0.25)',
        'card': '0 10px 24px -14px rgba(15, 23, 42, 0.25)',
      }
    },
  },
  plugins: [],
}

