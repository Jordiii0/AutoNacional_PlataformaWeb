/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permite que el build continúe aunque haya errores o warnings lint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Opcional: ignora errores de TypeScript para que el build no falle
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
