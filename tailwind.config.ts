import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
  	screens: {
  		xs: '420px',
  		sm: '640px',
  		md: '768px',
  		lg: '1024px',
  		xl: '1280px',
  		'2xl': '1536px',
  		'3xl': '1800px'
  	},
  	extend: {
  		colors: {
  			ink: {
  				'50': '#f8fafc',
  				'100': '#f1f5f9',
  				'200': '#e2e8f0',
  				'300': '#cbd5e1',
  				'400': '#94a3b8',
  				'500': '#64748b',
  				'600': '#475569',
  				'700': '#334155',
  				'800': '#1e293b',
  				'900': '#0f172a',
  				'950': '#020617'
  			},
  			brand: {
  				'50': '#f0fdfa',
  				'100': '#ccfbf1',
  				'200': '#99f6e4',
  				'300': '#5eead4',
  				'400': '#2dd4bf',
  				'500': '#14b8a6',
  				'600': '#0d9488',
  				'700': '#0f766e',
  				'800': '#115e59',
  				'900': '#134e4a'
  			},
  			spice: {
  				'50': '#fff7ed',
  				'100': '#ffedd5',
  				'200': '#fed7aa',
  				'300': '#fdba74',
  				'400': '#fb923c',
  				'500': '#f97316',
  				'600': '#ea580c',
  				'700': '#c2410c',
  				'800': '#9a3412',
  				'900': '#7c2d12'
  			},
  			success: {
  				'50': '#ecfdf5',
  				'100': '#dcfce7',
  				'500': '#22c55e',
  				'700': '#15803d'
  			},
  			warning: {
  				'50': '#fffbeb',
  				'100': '#fef3c7',
  				'500': '#f59e0b',
  				'700': '#b45309'
  			},
  			danger: {
  				'50': '#fef2f2',
  				'100': '#fee2e2',
  				'500': '#ef4444',
  				'700': '#b91c1c'
  			},
  			info: {
  				'50': '#eff6ff',
  				'100': '#dbeafe',
  				'500': '#3b82f6',
  				'700': '#1d4ed8'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: 'hsl(var(--destructive))',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			display: [
  				'var(--font-display)',
  				'Poppins',
  				'var(--font-inter)',
  				'sans-serif'
  			]
  		},
  		spacing: {
  			'18': '4.5rem',
  			'22': '5.5rem',
  			'26': '6.5rem',
  			'30': '7.5rem'
  		},
  		borderRadius: {
  			xl: '1rem',
  			'2xl': '1.25rem',
  			'3xl': '1.75rem',
  			'4xl': '2rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		backgroundImage: {
  			'brand-gradient': 'linear-gradient(135deg,#14b8a6 0%,#0ea5e9 100%)',
  			'hero-gradient': 'linear-gradient(135deg,#14b8a6,#0f766e)',
  			'card-gradient': 'linear-gradient(to bottom,#ffffff,#f8fafc)',
  			'dark-gradient': 'linear-gradient(135deg,#0f172a,#020617)'
  		},
  		boxShadow: {
  			card: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
  			'card-hover': '0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)',
  			modal: '0 20px 60px rgba(0,0,0,0.2)',
  			'glow-brand': '0 0 1px rgba(20,184,166,.45),0 10px 30px rgba(20,184,166,.30)',
  			'glow-spice': '0 10px 30px rgba(249,115,22,.35)',
  			glass: '0 8px 32px rgba(0,0,0,.35)',
  			soft: '0 10px 40px rgba(2,8,23,.08)',
  			elevated: '0 20px 60px rgba(2,8,23,.12)',
  			premium: '0 30px 80px rgba(20,184,166,.18)'
  		},
  		backdropBlur: {
  			xs: '2px',
  			glass: '20px'
  		},
  		keyframes: {
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-1000px 0'
  				},
  				'100%': {
  					backgroundPosition: '1000px 0'
  				}
  			},
  			'fade-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(8px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'scale-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(.96)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			float: {
  				'0%,100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-6px)'
  				}
  			},
  			pulseSoft: {
  				'0%,100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '.7'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(20px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			spinSlow: {
  				from: {
  					transform: 'rotate(0deg)'
  				},
  				to: {
  					transform: 'rotate(360deg)'
  				}
  			}
  		},
  		animation: {
  			shimmer: 'shimmer 2s infinite linear',
  			'fade-up': 'fade-up .35s ease-out',
  			'scale-in': 'scale-in .2s ease-out',
  			float: 'float 4s ease-in-out infinite',
  			pulseSoft: 'pulseSoft 2s ease-in-out infinite',
  			slideUp: 'slideUp .45s ease',
  			spinSlow: 'spinSlow 12s linear infinite'
  		},
  		transitionTimingFunction: {
  			smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  			bounce: 'cubic-bezier(.34,1.56,.64,1)'
  		},
  		transitionDuration: {
  			'250': '250ms',
  			'400': '400ms'
  		}
  	}
  },

  plugins: [require("tailwindcss-animate")],
};

export default config;

