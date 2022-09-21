/** @type {import('next').NextConfig} */
const idp = "AUTH_IDP";
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
        idp: process.env[idp],
    },
};
