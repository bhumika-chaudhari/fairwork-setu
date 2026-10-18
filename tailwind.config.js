/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- 11-Role Earthy Warm Palette Specification ---
        // Brand Accents
        terracotta: '#B34A26',
        saffronGold: '#E5953E',
        warmAmber: '#F1B96B',
        // Contrast & Typography
        deepNavy: '#1E2B3E',
        earthyCharcoal: '#231F20',
        warmCocoa: '#7C2D16',
        // Surfaces & Environmental
        warmCream: '#FDF8F0',
        cleanWhite: '#FFFFFF',
        softBorder: '#F4EBDD',
        // Contextual & Illustration Accents
        dustyTeal: '#3A757D',
        safetyYellow: '#E5A823',

        // --- Semantic Mappings to Palette Roles ---
        deepEmerald: '#7C2D16', // Warm Cocoa for headers & high-impact titles
        primaryTeal: '#B34A26', // Terracotta for dominant brand CTA
        mint: '#E5953E',        // Saffron Gold for glowing accents & highlights
        saffron: '#E5A823',     // Safety Yellow / Saffron
        warmIvory: '#FDF8F0',   // Warm Cream
        emerald: '#7C2D16',     // Warm Cocoa
        teal: '#3A757D',        // Dusty Teal
        ivory: '#FDF8F0',       // Warm Cream
        primary: '#B34A26',     // Terracotta (Dominant brand CTA)
        primaryDark: '#7C2D16', // Warm Cocoa
        primarySoft: '#FDF3EE', // Soft terracotta tint
        accent: '#E5953E',      // Saffron Gold
        accentSoft: '#FEF4E8',  // Soft saffron tint
        background: '#FDF8F0',  // Warm Cream
        page: '#FDF8F0',        // Warm Cream
        surface: '#FFFFFF',     // Clean White
        surfaceAlt: '#FAF5ED',  // Warm Cream surface
        surfaceGlass: 'rgba(255, 255, 255, 0.85)',
        surfaceGlassHover: 'rgba(255, 255, 255, 0.95)',
        textPrimary: '#231F20', // Earthy Charcoal
        textSecondary: '#4A423D', // Earthy Warm Secondary
        textMuted: '#7D7068',   // Earthy Muted
        success: '#2E7D32',
        successSoft: '#F1F8F3',
        warning: '#E5A823',     // Safety Yellow
        warningSoft: '#FEF9EC',
        danger: '#B34A26',      // Terracotta
        dangerSoft: '#FDF3EE',
        health: '#B34A26',      // Terracotta
        healthSoft: '#FEF4E8',  // Soft saffron
        border: '#F4EBDD',      // Soft Border
        glassBorder: 'rgba(244, 235, 221, 0.88)',
      },
      maxWidth: {
        app: '480px',
        desktop: '1200px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"SF Pro"',
          'system-ui',
          '"Noto Sans"',
          '"Noto Sans Devanagari"',
          'sans-serif',
        ],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(124, 45, 22, 0.06), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 1px 0 rgba(244, 235, 221, 0.4)',
        glassHover: '0 14px 44px 0 rgba(124, 45, 22, 0.10), inset 0 1px 2px 0 rgba(255, 255, 255, 0.98), inset 0 -1px 1px 0 rgba(244, 235, 221, 0.5)',
        glassActive: '0 4px 16px 0 rgba(124, 45, 22, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
        dock: '0 20px 50px -10px rgba(30, 43, 62, 0.18), 0 0 0 1px rgba(244, 235, 221, 0.9), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 1px 0 rgba(241, 185, 107, 0.2)',
        dockActive: '0 6px 20px rgba(179, 74, 38, 0.35), inset 0 1px 1.5px rgba(255, 255, 255, 0.6)',
        glassModal: '0 28px 70px -12px rgba(30, 43, 62, 0.22), 0 0 0 1px rgba(244, 235, 221, 0.85), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)',
        card: '0 4px 24px rgba(124, 45, 22, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
        lifted: '0 16px 40px rgba(124, 45, 22, 0.10), inset 0 1px 1.5px rgba(255, 255, 255, 0.9)',
        clay: '0 8px 24px rgba(179, 74, 38, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
        glow: '0 0 36px rgba(229, 149, 62, 0.40)',
        nav: '0 -4px 24px rgba(124, 45, 22, 0.06)',
      },
      borderRadius: {
        card: '24px',
        btn: '20px',
      },
      backgroundImage: {
        'emerald-gradient': 'linear-gradient(135deg, #B34A26 0%, #7C2D16 100%)',
        'terracotta-gradient': 'linear-gradient(135deg, #B34A26 0%, #7C2D16 100%)',
        'saffron-gradient': 'linear-gradient(135deg, #E5953E 0%, #E5A823 100%)',
        'amber-gradient': 'linear-gradient(135deg, #F1B96B 0%, #E5953E 100%)',
        'navy-gradient': 'linear-gradient(135deg, #1E2B3E 0%, #151D2A 100%)',
        'teal-gradient': 'linear-gradient(135deg, #3A757D 0%, #2A565C 100%)',
        'mint-gradient': 'linear-gradient(135deg, #F1B96B 0%, #B34A26 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(253,248,240,0.65) 100%)',
        'liquid-sheen': 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'fade-up': 'fade-up 0.3s ease-out both',
        'slide-up': 'slide-up 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
      },
    },
  },
  plugins: [],
};
