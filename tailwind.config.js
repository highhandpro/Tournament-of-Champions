/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(220 15% 22%)",
        input: "hsl(220 15% 22%)",
        ring: "hsl(153 50% 45%)",
        background: "hsl(220 20% 10%)",
        foreground: "hsl(40 20% 95%)",
        primary: {
          DEFAULT: "hsl(153 50% 45%)",
          foreground: "hsl(220 20% 10%)",
        },
        secondary: {
          DEFAULT: "hsl(220 15% 20%)",
          foreground: "hsl(40 20% 95%)",
        },
        destructive: {
          DEFAULT: "hsl(0 70% 50%)",
          foreground: "hsl(40 20% 95%)",
        },
        muted: {
          DEFAULT: "hsl(220 15% 18%)",
          foreground: "hsl(220 10% 60%)",
        },
        accent: {
          DEFAULT: "hsl(43 80% 55%)",
          foreground: "hsl(220 20% 10%)",
        },
        popover: {
          DEFAULT: "hsl(220 18% 14%)",
          foreground: "hsl(40 20% 95%)",
        },
        card: {
          DEFAULT: "hsl(220 18% 14%)",
          foreground: "hsl(40 20% 95%)",
        },
        sidebar: {
          DEFAULT: "hsl(220 18% 12%)",
          foreground: "hsl(40 20% 95%)",
          primary: "hsl(153 50% 45%)",
          "primary-foreground": "hsl(220 20% 10%)",
          accent: "hsl(220 15% 18%)",
          "accent-foreground": "hsl(40 20% 95%)",
          border: "hsl(220 15% 22%)",
          ring: "hsl(153 50% 45%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: {
            opacity: 0,
            transform: "translateY(10px)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/forms')],
}