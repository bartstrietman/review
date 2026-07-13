export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      secondary: 'gold',
      neutral: 'sand',
    },
    button: {
      slots: {
        base: 'font-semibold',
      },
      defaultVariants: {
        size: 'lg',
      },
    },
  },
})
