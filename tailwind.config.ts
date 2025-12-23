import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Hitman-inspired color palette
        hitman: {
          red: '#C41E3A',
          darkRed: '#8B0000',
          black: '#0D0D0D',
          charcoal: '#1A1A1A',
          gunmetal: '#2C3539',
          silver: '#C0C0C0',
          white: '#F5F5F5',
          gold: '#D4AF37',
        },
        // Netflix-inspired
        netflix: {
          red: '#E50914',
          black: '#141414',
          dark: '#181818',
          gray: '#808080',
        },
      },
      fontFamily: {
        hitman: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hitman-gradient': 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2C3539 100%)',
        'agent-pattern': 'radial-gradient(circle at 50% 50%, rgba(196, 30, 58, 0.1) 0%, transparent 50%)',
      },
      animation: {
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(196, 30, 58, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(196, 30, 58, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
