import path from 'path';
import { fileURLToPath } from 'url';

// Mendapatkan root folder untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // INI KUNCINYA: Memaksa Vercel melacak file mesin Prisma hingga ke akar monorepo
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

export default nextConfig;