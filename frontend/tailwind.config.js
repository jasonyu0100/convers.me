module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {},
      boxShadow: {
        glow: '-15px 15px 50px 0px rgba(255, 255, 255, 0.15)',
      },
      fontFamily: {
        thin: ['var(--font-creato-thin)'],
        thinItalic: ['var(--font-creato-thinitalic)'],
        light: ['var(--font-creato-light)'],
        regular: ['var(--font-creato-regular)'],
        medium: ['var(--font-creato-medium)'],
        bold: ['var(--font-creato-bold)'],
        extraBold: ['var(--font-creato-extrabold)'],
        black: ['var(--font-creato-black)'],
      },
      animation: {
        loadingBar: 'loadingBar 2s infinite linear',
        fadeIn: 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        slideIn: 'slideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        scaleIn: 'scaleIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        slideUp: 'slideUp 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        loadingBar: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px) scale(0.98)', opacity: 0 },
          '100%': { transform: 'translateY(0) scale(1)', opacity: 1 },
        },
      },
    },
  },
};
