/** @type {import('next').NextConfig} */
const nextConfig = {
    // Standar Next.js 14
    experimental: {
      serverComponentsExternalPackages: ['node-zklib'],
    },
    
    // Penegasan paksa di level Webpack
    webpack: (config, { isServer }) => {
      if (isServer) {
        config.externals = [...(config.externals || []), '@node-rs/argon2'];
      }
      return config;
    },
  };
  
  export default nextConfig;