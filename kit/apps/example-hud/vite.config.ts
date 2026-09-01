import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Builds directly into web/build of the final FiveM resource:
  // no manual file copying needed after each build.
  build: {
    outDir: '../../resources/example-hud/web/build',
    emptyOutDir: true,
  },
});
