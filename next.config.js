/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: "standalone",
};

module.exports = {
    ...withBundleAnalyzer(nextConfig),
    publicRuntimeConfig: {
        idp: process.env.AUTH_IDP,
    },
};
