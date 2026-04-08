/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/Genealogy",
  // Lưu ý: Không dùng assetPrefix khi đã có basePath trên GitHub Pages
  trailingSlash: true, // Rất quan trọng để GitHub Pages hiểu các đường dẫn con
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["m2c.infura-ipfs.io", "ipfs.io", "i.ibb.co"],
    unoptimized: true,
  },
  env: {
    PRIVATE_KEY: process.env.PRIVATE_KEY,
  },
};

export default nextConfig;
