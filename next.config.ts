
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos', // Added picsum.photos
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'st4.depositphotos.com', // Added hostname
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.shutterstock.com', // Added hostname
        port: '',
        pathname: '/**',
      },
      { // Added Freepik hostname
        protocol: 'https',
        hostname: 'img.freepik.com',
        port: '',
        pathname: '/**',
      },
      { // Added Google Static Content hostname
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
    webpack: (config, { isServer }) => {
    // See https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
      };
    }
    return config;
  }
};

export default nextConfig;
