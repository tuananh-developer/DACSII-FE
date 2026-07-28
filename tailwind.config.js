/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff385c',
          active: '#e00b41',
          disabled: '#ffd1da',
        },
        ink: '#222222',
        body: '#3f3f3f',
        muted: '#6a6a6a',
        'muted-soft': '#929292',
        canvas: '#ffffff',
        surface: {
          soft: '#f7f7f7',
          strong: '#f2f2f2',
        },
        hairline: {
          DEFAULT: '#dddddd',
          soft: '#ebebeb',
        },
        scrim: 'rgba(0, 0, 0, 0.5)',
        // Strike Admin Colors
        strike: {
          primary: '#533afd',
          'primary-deep': '#4434d4',
          'primary-press': '#2e2b8c',
          ink: '#0d253d',
          'ink-mute': '#64748d',
          dark: '#1c1e54',
          canvas: '#f6f9fc',
          hairline: '#e3e8ee'
        }
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '32px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'float': 'rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0',
      }
    },
  },
  plugins: [],
}