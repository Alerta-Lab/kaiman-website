import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * Brand tokens aligned with Wizard AI.
 * Landing uses ink/feature/display; blog/admin also use black scale + status.
 */
const config = {
	plugins: [typography],
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#6B48E9',
					100: '#EBEAFD',
					200: '#D8D7FD',
					300: '#BBB7FB',
					400: '#998EF7',
					500: '#7660F2',
					600: '#6B48E9',
					700: '#552DD4',
					800: '#4725B2',
					900: '#3B2092',
				},
				ink: {
					DEFAULT: '#000000',
					100: '#181818',
					200: '#1F1F1F',
					300: '#272727',
					400: '#313131',
				},
				error: { DEFAULT: '#ff6b6b', 100: '#FFE5E5', 500: '#ff6b6b', 700: '#C93A3A' },
				success: { DEFAULT: '#80ff91', 100: '#E8FFEB', 500: '#80ff91', 700: '#3BB84F' },
				warning: { DEFAULT: '#FCD34D' },
				black: {
					DEFAULT: '#212121',
					capsule: '#363636',
					'capsule-hover': '#616161',
					stroke: '#404040',
					panel: '#1a1a1a',
				},
				feature: {
					analysis: '#2563EB',
					image: '#DB2777',
					creators: '#16A34A',
					video: '#EA580C',
					script: '#0891B2',
					presentation: '#A204CA',
					audio: '#9F1239',
				},
			},
			fontFamily: {
				sans: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				display: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				headline: ['Space Grotesk', 'sans-serif'],
				body: ['Quicksand', 'sans-serif'],
			},
			fontWeight: { body: '600' },
			maxWidth: {
				content: '72rem',
				copy: '42rem',
			},
			borderRadius: {
				sm: '0.125rem',
				DEFAULT: '0.25rem',
				md: '0.375rem',
				lg: '0.5rem',
				xl: '0.75rem',
				'2xl': '1rem',
			},
			spacing: {
				'gap-tight': '0.25rem',
				'gap-chip': '0.5rem',
				'gap-control': '0.75rem',
				'gap-section': '1rem',
				'gap-block': '1.5rem',
				'gap-page': '2rem',
			},
			transitionTimingFunction: {
				brand: 'cubic-bezier(0.22, 1, 0.36, 1)',
			},
		},
	},
} satisfies Config;

export default config;
