import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'IccXmlParserVueComponent',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', '@icc-xml-parser/core', 'pixi.js'],
      output: {
        globals: {
          vue: 'Vue',
          '@icc-xml-parser/core': 'IccXmlParserCore',
          'pixi.js': 'PIXI'
        }
      }
    },
    outDir: 'dist'
  }
});