/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#64748b",
        accent: "#f59e0b",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
        personal: "#8b5cf6",
        work: "#2563eb",
        other: "#10b981",
        surface: "#ffffff",
        background: "#f8fafc"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'scale-in': 'scale-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-in',
        'slide-in-top': 'slide-in-top 0.3s ease-out',
        'check-mark': 'check-mark 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-scale': 'pulse-scale 0.1s ease-out',
      },
      keyframes: {
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-top': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'check-mark': {
          '0%': { transform: 'scale(0) rotate(45deg)' },
          '100%': { transform: 'scale(1) rotate(45deg)' },
        },
        'pulse-scale': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}