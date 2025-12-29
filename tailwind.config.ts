import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Status semantic colors
        status: {
          success: {
            DEFAULT: "hsl(var(--status-success))",
            foreground: "hsl(var(--status-success-foreground))",
            muted: "hsl(var(--status-success-muted))",
          },
          warning: {
            DEFAULT: "hsl(var(--status-warning))",
            foreground: "hsl(var(--status-warning-foreground))",
            muted: "hsl(var(--status-warning-muted))",
          },
          error: {
            DEFAULT: "hsl(var(--status-error))",
            foreground: "hsl(var(--status-error-foreground))",
            muted: "hsl(var(--status-error-muted))",
          },
          info: {
            DEFAULT: "hsl(var(--status-info))",
            foreground: "hsl(var(--status-info-foreground))",
            muted: "hsl(var(--status-info-muted))",
          },
          neutral: {
            DEFAULT: "hsl(var(--status-neutral))",
            foreground: "hsl(var(--status-neutral-foreground))",
            muted: "hsl(var(--status-neutral-muted))",
          },
        },
      },
      // Spacing scale using CSS custom properties
      spacing: {
        'space-0': 'var(--space-0)',
        'space-1': 'var(--space-1)',
        'space-2': 'var(--space-2)',
        'space-3': 'var(--space-3)',
        'space-4': 'var(--space-4)',
        'space-5': 'var(--space-5)',
        'space-6': 'var(--space-6)',
        'space-8': 'var(--space-8)',
      },
      // Typography scale
      fontSize: {
        'display': ['var(--text-display)', { lineHeight: '1.2', fontWeight: '700' }],
        'heading': ['var(--text-heading)', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['var(--text-subheading)', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['var(--text-body)', { lineHeight: '1.5', fontWeight: '400' }],
        'data': ['var(--text-data)', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['var(--text-caption)', { lineHeight: '1.4', fontWeight: '400' }],
        'micro': ['var(--text-micro)', { lineHeight: '1.3', fontWeight: '500' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
