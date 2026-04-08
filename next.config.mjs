/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/Genealogy",
  trailingSlash: true, // Thêm dòng này để hỗ trợ GitHub Pages tốt hơn
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["ipfs.io", "i.ibb.co"],
    unoptimized: true,
  },
  env: {
    PRIVATE_KEY: process.env.PRIVATE_KEY,
  },
};

export default nextConfig; // Sử dụng export default cho file .mjs
