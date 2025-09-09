/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        white: '#ffffff',
        lightBlue: '#93c5fd',
        blue: '#3b82f6',
        darkBlue: '#1e3a8a',
        darkBlueBg: '#172554', // Slightly lighter dark blue for cards/backgrounds
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        md: '0 4px 8px rgba(59,130,246,0.15)',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['disabled', 'hover', 'focus'],
      cursor: ['disabled'],
      scale: ['hover', 'focus'],
      boxShadow: ['hover', 'focus'],
    },
  },
  plugins: [],
};