/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Bắt buộc cho GitHub Pages
  basePath: "/Genealogy", // Tên kho lưu trữ (repository name) của bạn
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["m2c.infura-ipfs.io", "ipfs.io", "i.ibb.co"],
    unoptimized: true, // Bắt buộc vì GitHub Pages không hỗ trợ Image Optimization của Next.js
  },
  env: {
    PRIVATE_KEY: process.env.PRIVATE_KEY,
  },
};

module.exports = nextConfig;
