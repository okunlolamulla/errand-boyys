import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run build` writes the finished website to dist/ (public/ is copied as it is, so config.js and catalog.json stay editable).
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
});
