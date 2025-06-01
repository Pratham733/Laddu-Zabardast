/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    swcMinify: true,
    poweredByHeader: false,
    compress: true,
    env: {
        MONGODB_URI: process.env.MONGODB_URI?.replace(/["']/g, ''),
        MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
        JWT_SECRET: process.env.JWT_SECRET,
        NEXT_PUBLIC_BASE_URL: 'https://laddu-zab.vercel.app',
        NEXTAUTH_URL: 'https://laddu-zab.vercel.app'
    },
    images: {
        domains: ['c8.alamy.com', 'via.placeholder.com'],
        unoptimized: true,
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                module: false,
                perf_hooks: false,
            };
        }
        return config;
    },

    typescript: {
        ignoreBuildErrors: true,
    },

    eslint: {
        ignoreDuringBuilds: true,
    },

    experimental: {
        serverActions: true,
    },
};

module.exports = nextConfig;
