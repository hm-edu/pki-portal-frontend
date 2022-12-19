/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: false,
    productionBrowserSourceMaps: true,
    output: "standalone",
};

module.exports = {
    ...nextConfig,
    webpack: (config, { webpack, isServer }) => {
        const envs = {};
        Object.keys(process.env).forEach((env) => {
            if (env.startsWith("NEXT_PUBLIC_")) {
                envs[env] = process.env[env];
            }
        });

        if (!isServer) {
            config.plugins.push(
                new webpack.DefinePlugin({
                    "process.env": JSON.stringify(envs),
                }),
            );
        }

        return config;
    },
};
