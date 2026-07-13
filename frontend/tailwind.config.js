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
        navy: {
          DEFAULT: '#1a3a5c',
          deep: '#0f2237',
          mid: '#254d73',
        },
        cream: {
          DEFAULT: '#f5f0e8',
          dark: '#ede6d6',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e2c97e',
          pale: '#f7eed6',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-royal': 'linear-gradient(135deg, #0f2237 0%, #1a3a5c 55%, #254d73 100%)',
        'gradient-gold': 'linear-gradient(135deg, #c9a84c 0%, #e2c97e 100%)',
      },
    },
  },
  plugins: [],
}
