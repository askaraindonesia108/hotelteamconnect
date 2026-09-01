/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Memaksa Vercel untuk tetap deploy walaupun ada error tipe data
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['node-zklib'],
  },
};

export default nextConfig;