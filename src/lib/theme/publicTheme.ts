/**
 * Sistema de tokens de color para páginas públicas de Traesol
 * 
 * Establece una paleta coherente basada en los colores existentes del proyecto.
 * Todos los componentes públicos deben usar estos tokens para mantener consistencia visual.
 * 
 * @example
 * import { publicTheme } from '@/lib/theme/publicTheme';
 * 
 * <div className={publicTheme.colors.primary.bg}>
 *   <p className={publicTheme.colors.primary.text}>Texto</p>
 * </div>
 */

export const publicTheme = {
  colors: {
    // Primary: Azul principal (botones, links, elementos destacados)
    primary: {
      bg: "bg-blue-600",
      bgHover: "hover:bg-blue-700",
      text: "text-blue-600",
      textHover: "hover:text-blue-700",
      border: "border-blue-600",
      ring: "ring-blue-600",
    },

    // Primary Dark: Para heros y secciones destacadas - más profundo y premium
    primaryDark: {
      bg: "bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900",
      text: "text-slate-900",
      textOnDark: "text-white",
    },

    // Accent: Azul/celeste claro para badges, iconos sutiles, hover states
    accent: {
      bg: "bg-blue-50",
      bgHover: "hover:bg-blue-100",
      text: "text-blue-400",
      textStrong: "text-blue-500",
      border: "border-blue-100",
    },

    // Surface: Fondos de cards, páginas
    surface: {
      page: "bg-slate-50",
      card: "bg-white",
      cardHover: "hover:bg-slate-50",
      border: "border-slate-200/80",
      borderDashed: "border-dashed border-slate-200",
    },

    // Text: Jerarquía de textos
    text: {
      primary: "text-slate-900",
      secondary: "text-slate-600",
      muted: "text-slate-500",
      onDark: "text-white",
      onDarkMuted: "text-slate-300",
      onDarkSubtle: "text-slate-400",
    },

    // Status colors (success, emerald para voluntarios/corazón)
    status: {
      success: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
      },
      info: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-100",
      },
    },
  },

  // Estilos de componentes comunes
  components: {
    // Hero premium con gradiente profundo
    hero: {
      section: "relative bg-gradient-to-br from-slate-950 via-blue-950/80 to-slate-900 text-white py-20 md:py-28 overflow-hidden",
      container: "relative z-10 max-w-4xl mx-auto px-5 text-center",
      eyebrow: "text-xs font-semibold uppercase tracking-[0.35em] text-blue-400/90 mb-5",
      title: "text-4xl md:text-6xl font-bold mb-5 tracking-tight leading-[1.1]",
      subtitle: "text-lg md:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed",
    },

    // Card/isla de contenido
    card: {
      base: "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
      padding: "p-6 sm:p-10",
      hover: "transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.08)]",
    },

    // Sección de contenido en zona blanca
    section: {
      container: "mx-auto max-w-6xl space-y-14 px-5 py-14 lg:px-6",
      spacing: "space-y-14",
    },

    // Botones con microinteracciones
    button: {
      primary: "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-700/25 hover:-translate-y-0.5 active:translate-y-0",
      secondary: "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm",
      ghost: "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm",
    },

    // Links
    link: {
      primary: "inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-150",
      muted: "inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-700 transition-colors duration-150",
    },

    // Eyebrows/badges
    eyebrow: {
      default: "text-xs font-semibold uppercase tracking-[0.3em]",
      primary: "text-xs font-semibold uppercase tracking-[0.3em] text-blue-600",
      onDark: "text-xs font-semibold uppercase tracking-[0.3em] text-blue-400",
    },
  },

  // Spacing consistente - más generoso
  spacing: {
    section: "space-y-14",
    cardInner: "space-y-5",
    buttonGroup: "flex flex-wrap gap-4",
  },
} as const;

/**
 * Helper: Obtener clases para un card/isla estándar
 */
export function getCardClasses(withHover = false) {
  const base = `${publicTheme.components.card.base} ${publicTheme.components.card.padding}`;
  return withHover ? `${base} ${publicTheme.components.card.hover}` : base;
}

/**
 * Helper: Obtener clases para un hero limpio
 */
export function getHeroClasses() {
  return {
    section: publicTheme.components.hero.section,
    container: publicTheme.components.hero.container,
    eyebrow: publicTheme.components.hero.eyebrow,
    title: publicTheme.components.hero.title,
    subtitle: publicTheme.components.hero.subtitle,
  };
}

/**
 * Helper: Obtener clases para botón primario
 */
export function getPrimaryButtonClasses() {
  return publicTheme.components.button.primary;
}

/**
 * Helper: Obtener clases para botón secundario (ghost en dark)
 */
export function getGhostButtonClasses() {
  return publicTheme.components.button.ghost;
}
