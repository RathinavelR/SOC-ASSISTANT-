/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#070b14',
          card: 'rgba(13, 21, 39, 0.75)',
          'card-hover': 'rgba(19, 31, 58, 0.85)',
          border: 'rgba(30, 58, 110, 0.4)',
          'border-focus': 'rgba(6, 182, 212, 0.6)',
          accent: '#06b6d4',      // Cyan glow
          primary: '#3b82f6',     // Blue
          purple: '#8b5cf6',      // Purple
          critical: '#ef4444',    // Red
          high: '#f97316',        // Orange
          medium: '#eab308',      // Yellow
          low: '#06b6d4',         // Cyan
          success: '#10b981',     // Green
          text: '#f8fafc',
          muted: '#94a3b8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.3)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
