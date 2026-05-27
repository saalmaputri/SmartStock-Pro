export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f7f9fb',
        surface: '#ffffff',
        navy: '#001736',
        'navy-soft': '#002b5b',
        'blue-soft': '#f2f4f6',
        'blue-active': '#beddfe',
        slate: '#43474f',
        line: '#c4c6d0',
        danger: '#ba1a1a',
        success: '#079455',
        warning: '#dc6803'
      },
      boxShadow: {
        card: '0 30px 50px rgba(0, 43, 91, 0.06)',
        modal: '0 40px 80px rgba(0, 43, 91, 0.14)'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
