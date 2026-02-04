import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bwthjirvpdypmbvpsjtl.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jamara.us',
        pathname: '/photos/**',
      },
      {
        protocol: 'https',
        hostname: 'wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
