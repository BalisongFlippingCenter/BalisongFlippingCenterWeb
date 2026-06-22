/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    colors: {
      'dark-primary': '#001314',
      'blue-primary': '#108198',
      'shadow-green': '#001a1a',
      'shadow-green-offset': '#003333',
      'dark-neutral': '#0a0c10',
      'dark-neutral-offset': '#111318',
      'white': '#ffffff',
      'black': '#000000',
      'light-blue': '#99c2ff',
      'blue': '#0066ff',
      'red': '#b91c1c',
      'green': '#22c55e',
      'instagram-pink': '#e1306c',
      'gold': '#e6b800',
      'shadow-red': '#1a0000',
      'shadow-red-mid': '#2a0000',
      'shadow-red-offset': '#330000',
      'shadow': '#808080',
      'teal': '#0d9488',
      'shadow-teal': '#021a19',
      'shadow-teal-mid': '#042f2e',
    },
    screens: {
      'xsm': '100px',
      'sm': '550px',
      'md': '950px',
      'nav': '1150px',
      'lg': '1310px',
      'short': { 'raw': '(max-height: 800px)' },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fade_in_out: {
          to: { opacity: '1' }
        },
        gentle_bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-7px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'text-fade':     'fade_in_out 5s linear',
        'gentle-bounce': 'gentle_bounce 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

