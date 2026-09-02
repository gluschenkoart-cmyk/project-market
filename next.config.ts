import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Файли проєктів (рендери, фото робіт) поки зберігаються локально під час розробки.
    // Коли підключимо S3-сумісне сховище (Етап 4), сюди додамо його домен.
    remotePatterns: [],
  },
};

export default nextConfig;
