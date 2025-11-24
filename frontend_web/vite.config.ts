import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080, //config host
  },
  plugins: [react(),],
  resolve: {
    alias: {
      //khai báo đường dẫn cho dễ
      '@': path.resolve(__dirname, './src'),
      '@component': path.resolve(__dirname, './src/modules/user/components'),
      '@app': path.resolve(__dirname, './src/app'),
      '@admin': path.resolve(__dirname, './src/modules/admin'),
      '@user': path.resolve(__dirname, './src/modules/user'),
    },
  },
}));
