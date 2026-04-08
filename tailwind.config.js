/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B2B6B',
          light: '#EDF0F8',
        },
        teal: {
          DEFAULT: '#00C2A8',
          light: '#E6FAF7',
        },
        mid: '#555566',
        border: '#DEDEDE',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(27, 43, 107, 0.08)',
        'card-hover': '0 4px 20px rgba(27, 43, 107, 0.14)',
      },
    },
  },
  plugins: [],
}
