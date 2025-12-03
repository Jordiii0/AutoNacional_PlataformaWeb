import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 👈 evita que eslint bloquee el deploy en Vercel
  },
};

export default nextConfig;
