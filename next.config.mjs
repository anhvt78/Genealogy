/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: "export", // Kích hoạt chế độ Static Export
  basePath: "/Genealogy",
  assetPrefix: "/Genealogy/",
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["m2c.infura-ipfs.io", "ipfs.io", "i.ibb.co"],
    // formats: ["image/webp"],
    unoptimized: true,
    // domains:["localhost", "192.168.0.101",  "marketplace.cwgame.io", "ipfs.io"]
  },
  env: {
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    
  },
};

export default nextConfig;
