import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unzipper"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
