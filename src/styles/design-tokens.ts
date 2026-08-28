// Design tokens for the application
export const designTokens = {
  colors: {
    // Neutral palette
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(222.2, 84%, 4.9%)',
    
    // Primary - Blue
    primary: {
      50: 'hsl(210, 40%, 98%)',
      100: 'hsl(210, 40%, 96%)',
      200: 'hsl(214.3, 31.8%, 91.4%)',
      300: 'hsl(213.3, 27%, 84.3%)',
      400: 'hsl(215, 20.2%, 65.1%)',
      500: 'hsl(215.4, 16.3%, 46.9%)',
      600: 'hsl(215.4, 16.3%, 34.9%)',
      700: 'hsl(215.4, 16.3%, 25.9%)',
      800: 'hsl(215.4, 16.3%, 18.9%)',
      900: 'hsl(215.4, 16.3%, 11.9%)',
    },
    
    // Secondary - Slate
    secondary: {
      50: 'hsl(210, 40%, 98%)',
      100: 'hsl(210, 40%, 96%)',
      200: 'hsl(214.3, 31.8%, 91.4%)',
      300: 'hsl(213.3, 27%, 84.3%)',
      400: 'hsl(215, 20.2%, 65.1%)',
      500: 'hsl(215.4, 16.3%, 46.9%)',
      600: 'hsl(215.4, 16.3%, 34.9%)',
      700: 'hsl(215.4, 16.3%, 25.9%)',
      800: 'hsl(215.4, 16.3%, 18.9%)',
      900: 'hsl(215.4, 16.3%, 11.9%)',
    },
    
    // Semantic colors
    success: {
      50: 'hsl(142.1, 76.2%, 96.3%)',
      100: 'hsl(142.1, 76.2%, 86.3%)',
      500: 'hsl(142.1, 70.6%, 45.3%)',
      600: 'hsl(142.1, 70.6%, 35.3%)',
    },
    warning: {
      50: 'hsl(38, 92%, 96%)',
      100: 'hsl(38, 92%, 86%)',
      500: 'hsl(38, 92%, 50%)',
      600: 'hsl(38, 92%, 40%)',
    },
    destructive: {
      50: 'hsl(0, 85%, 97%)',
      100: 'hsl(0, 85%, 87%)',
      500: 'hsl(0, 84%, 60%)',
      600: 'hsl(0, 84%, 50%)',
    },
    info: {
      50: 'hsl(200, 100%, 96%)',
      100: 'hsl(200, 100%, 86%)',
      500: 'hsl(200, 100%, 50%)',
      600: 'hsl(200, 100%, 40%)',
    },
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem',
  },
  
  typography: {
    fontFamily: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  
  transition: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};