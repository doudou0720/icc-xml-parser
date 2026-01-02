import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'IccXmlParserUtil',
      fileName: 'index',
      formats: ['es']
    },
    outDir: 'dist'
  }
});