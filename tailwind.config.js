/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: {
          900: '#020617',
          800: '#0b1329',
          700: '#1c2541',
        },
        neonBlue: {
          DEFAULT: '#3b82f6',
          glow: '#60a5fa',
        },
        neonCyan: {
          DEFAULT: '#06b6d4',
          glow: '#22d3ee',
        },
        neonPurple: {
          DEFAULT: '#a855f7',
          glow: '#c084fc',
        },
        neonGreen: {
          DEFAULT: '#10b981',
          glow: '#34d399',
        },
        neonRed: {
          DEFAULT: '#ef4444',
          glow: '#f87171',
        },
        neonOrange: {
          DEFAULT: '#f97316',
          glow: '#fb923c',
        }
      },
      backgroundImage: {
        'futuristic-radial': 'radial-gradient(circle at 50% 50%, #0b1329 0%, #020617 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'neon-border-glow': 'linear-gradient(90deg, #3b82f6, #06b6d4, #a855f7)',
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.35)',
        'neon-cyan': '0 0 15px rgba(6, 118, 212, 0.35)',
        'neon-purple': '0 0 15px rgba(168, 85, 247, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.8', boxShadow: '0 0 15px rgba(59, 130, 246, 0.35)' },
          '50%': { opacity: '1', boxShadow: '0 0 25px rgba(59, 130, 246, 0.65)' },
        }
      }
    },
  },
  plugins: [],
};
