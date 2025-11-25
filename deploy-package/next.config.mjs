/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para Next.js 14 - appDir é padrão agora
  output: 'standalone', // Para Docker e deploy otimizado
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Edge Functions
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
