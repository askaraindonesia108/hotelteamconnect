/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      'node-zklib',
      '@node-rs/argon2',
      '@prisma/client',
      '@team-connect/database'
    ],
  },
};


export default nextConfig;