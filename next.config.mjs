/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: "export", // Kích hoạt chế độ Static Export
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
    // INFURA_API_KEY: process.env.INFURA_API_KEY,
    // INFURA_API_KEY_SECRET: process.env.INFURA_API_KEY_SECRET,
    // NODE_ENV : process.env.NODE_ENV,
    //USER_NAME : process.env.USER_NAME,
    //DATABASE : process.env.DATABASE,
    //DATABASE_PASSWORD : process.env.DATABASE_PASSWORD,
    // firebase_apiKey: process.env.firebase_apiKey,
    // firebase_authDomain: process.env.firebase_authDomain,
    // firebase_projectId: process.env.firebase_projectId,
    // firebase_storageBucket: process.env.firebase_storageBucket,
    // firebase_messagingSenderId: process.env.firebase_messagingSenderId,
    // firebase_appId: process.env.firebase_appId,
    // firebase_databaseURL: process.env.firebase_databaseURL,
  },
};

export default nextConfig;
