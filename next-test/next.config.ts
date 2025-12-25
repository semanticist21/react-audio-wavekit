import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["react-audio-wavekit"],
  turbopack: {
    // Set root to parent directory to resolve linked packages
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
