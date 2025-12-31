/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000', // Pure black header/menu bg (like AIOStreams)
          border: '#1a1a1a', // Dark gray border
          hover: '#0a0a0a',
          text: {
            DEFAULT: '#1F321A', // Normal text (light mode)
            dark: '#FFFFFF', // Pure white text for dark mode
          },
        },
        accent: {
          DEFAULT: '#8B5CF6', // Purple buttons/links (light mode) - modern and cool
          dark: '#A78BFA', // Bright purple buttons/links (dark mode) - vibrant and sophisticated
        },
        surface: {
          DEFAULT: '#FFFFFF', // Main layout bg (light mode - white)
          dark: '#0d0d0d', // Very dark gray background (slightly lighter than black header)
          alt: {
            DEFAULT: '#F5F5F5', // Table header bg (light mode - light gray)
            dark: '#0a0a0a', // Very dark gray alt bg (for alternating rows)
            hover: {
              DEFAULT: '#f5f1e5',
              dark: '#1a1a1a', // Dark gray hover
            },
            selected: {
              DEFAULT: '#efeadc',
              dark: '#1a1a1a', // Dark gray selected
              hover: {
                DEFAULT: '#efe8d7',
                dark: '#262626', // Slightly lighter on hover
              },
            },
          },
          hover: {
            DEFAULT: '#f2761e07',
            dark: '#1a1a1a', // Dark gray hover
          },
        },
        border: {
          DEFAULT: '#cecece',
          dark: '#2a2a2a', // Dark gray border (visible on black)
        },
        label: {
          // GREEN
          success: {
            text: '#387d20',
            'text-dark': '#10B981', // Bright green for dark mode
            bg: '#e2f1de',
            'bg-dark': '#064E3B', // Dark mode success bg
          },
          // RED
          danger: {
            text: '#c1444c',
            'text-dark': '#EF4444', // Bright red for dark mode
            bg: '#f7dfe2',
            'bg-dark': '#7F1D1D', // Dark mode danger bg
          },
          // YELLOW
          warning: {
            text: '#d9a31b',
            'text-dark': '#F59E0B', // Bright amber for dark mode
            bg: '#f7f0df',
            'bg-dark': '#78350F', // Dark mode warning bg
          },
          // BLUE
          active: {
            text: '#3871e3',
            'text-dark': '#3B82F6', // Bright blue for dark mode
            bg: '#dee5f9',
            'bg-dark': '#1E3A8A', // Dark mode active bg
          },
          // GRAY
          default: {
            text: '#828282',
            'text-dark': '#9CA3AF', // Light gray for dark mode
            bg: '#e7e7e7',
            'bg-dark': '#1F2937', // Dark gray bg
          },
        },
        downloaded: {
          DEFAULT: '#e8f1e8',
          dark: '#0a1a0a', // Very dark green tint
          hover: {
            DEFAULT: '#e1f0e1',
            dark: '#0f1f0f',
          },
        },
        'primary-text': {
          DEFAULT: '#1F321A', // Normal text (light mode)
          dark: '#FFFFFF', // Pure white text for dark mode
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
      },
      borderColor: {
        DEFAULT: '#cecece',
        dark: '#2a2a2a',
      },
    },
  },
  plugins: [],
};
