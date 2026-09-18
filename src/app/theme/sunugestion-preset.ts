import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const SunugestionPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: 'color-mix(in srgb, #1A3C5E 10%, white)',
      100: 'color-mix(in srgb, #1A3C5E 20%, white)',
      200: 'color-mix(in srgb, #1A3C5E 35%, white)',
      300: 'color-mix(in srgb, #1A3C5E 50%, white)',
      400: 'color-mix(in srgb, #1A3C5E 70%, white)',
      500: '#1A3C5E',
      600: 'color-mix(in srgb, #1A3C5E 85%, black)',
      700: 'color-mix(in srgb, #1A3C5E 70%, black)',
      800: 'color-mix(in srgb, #1A3C5E 55%, black)',
      900: 'color-mix(in srgb, #1A3C5E 40%, black)',
      950: 'color-mix(in srgb, #1A3C5E 25%, black)'
    },
    colorScheme: {
      light: {
        primary: {
          color: '#1A3C5E',
          contrastColor: '#F5F7FA',
          hoverColor: 'color-mix(in srgb, #1A3C5E 85%, black)',
          activeColor: 'color-mix(in srgb, #1A3C5E 70%, black)'
        },
        text: {
          color: '#2D2D2D'
        }
      }
    }
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            success: { background: '#2E8B57', hoverBackground: 'color-mix(in srgb, #2E8B57 85%, black)' },
            warn: { background: '#E8A020', hoverBackground: 'color-mix(in srgb, #E8A020 85%, black)' },
            danger: { background: '#E74C3C', hoverBackground: 'color-mix(in srgb, #E74C3C 85%, black)' }
          }
        }
      }
    },
    tag: {
      colorScheme: {
        light: {
          success: { background: '#D6EFE0', color: '#2E8B57' },
          warn: { background: '#FDF3E0', color: '#E8A020' },
          danger: { background: '#FDECEA', color: '#E74C3C' }
        }
      }
    }
  }
});
