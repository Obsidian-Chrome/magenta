export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          magenta: '#FF00FF',
          yellow: '#FFFF00',
          black: '#000000',
          dark: '#0a0a0f',
        }
      },
      fontFamily: {
        sans: ['Rajdhani', 'Orbitron', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { 
            boxShadow: '0 0 5px rgba(255,0,255,0.5), 0 0 10px rgba(255,0,255,0.3)',
          },
          '100%': { 
            boxShadow: '0 0 10px rgba(255,0,255,0.8), 0 0 20px rgba(255,0,255,0.5), 0 0 30px rgba(255,0,255,0.3)',
          },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
