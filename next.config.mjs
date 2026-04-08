/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // KHÔNG cần basePath và assetPrefix khi dùng custom domain
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    domains: ["m2c.infura-ipfs.io", "ipfs.io", "i.ibb.co"],
    unoptimized: true,
  },
  env: {
    PRIVATE_KEY: process.env.PRIVATE_KEY,
  },
};

export default nextConfig;
