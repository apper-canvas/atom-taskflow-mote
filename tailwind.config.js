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
        background: "#f8fafc",
        // Debug colors for visibility testing
        'debug-red': "#ef4444",
        'debug-yellow': "#f59e0b",
        'debug-blue': "#3b82f6"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
},
      animation: {
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-in forwards',
        'slide-in-top': 'slide-in-top 0.4s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'bounce-in': 'bounce-in 0.5s ease-out forwards',
        'check-mark': 'check-mark 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-scale': 'pulse-scale 0.1s ease-out',
        'toast-slide-in': 'toast-slide-in 0.3s ease-out',
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
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
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
        'toast-slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      zIndex: {
        'modal': '50000',
        'dropdown': '40000',
        'tooltip': '30000',
        'toast': '999999',
      },
    },
  },
  plugins: [],
}