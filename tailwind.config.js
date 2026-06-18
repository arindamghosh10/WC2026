/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          900: '#061a0d',
          800: '#0a2e14',
          700: '#0f3d1c',
          600: '#145224',
          500: '#1a6a2e',
        },
        goal: '#6fcf97',
        card: 'rgba(255,255,255,0.06)',
        cardBorder: 'rgba(255,255,255,0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Oswald', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
