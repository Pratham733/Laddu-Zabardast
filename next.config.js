/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
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
