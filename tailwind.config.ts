import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bl-dark': '#060a12',
        'bl-card': '#0d1527',
        'bl-card-border': '#1e293b',
        'bl-blue': '#0066ff',
        'bl-cyan': '#00f0ff',
        'bl-neon': '#00ff88',
        'bl-crimson': '#ff0055',
        'bl-gold': '#ffb703',
      },
      backgroundImage: {
        'ego-gradient': 'linear-gradient(135deg, #060a12 0%, #0d1527 50%, #081329 100%)',
        'flow-gradient': 'linear-gradient(135deg, #ff0055 0%, #7928ca 100%)',
        'aura-gradient': 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
export default config;
