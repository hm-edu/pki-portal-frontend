/** @type {import('next').NextConfig} */

const { withSentryConfig } = require("@sentry/nextjs");

const sentryWebpackPluginOptions = {
    // Additional config options for the Sentry Webpack plugin. Keep in mind that
    // the following options are set automatically, and overriding them is not
    // recommended:
    //   release, url, org, project, authToken, configFile, stripPrefix,
    //   urlPrefix, include, ignore

    silent: true, // Suppresses all logs
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options.
};

const moduleExports = {
    reactStrictMode: true,
    swcMinify: false,
    productionBrowserSourceMaps: true,
    output: "standalone",
    sentry: {
        // Use `hidden-source-map` rather than `source-map` as the Webpack `devtool`
        // for client-side builds. (This will be the default starting in
        // `@sentry/nextjs` version 8.0.0.) See
        // https://webpack.js.org/configuration/devtool/ and
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#use-hidden-source-map
        // for more information.
        hideSourceMaps: true,
    },
    webpack: (config, { webpack, isServer }) => {
        const envs = {};
        Object.keys(process.env).forEach((env) => {
            if (env.startsWith("NEXT_PUBLIC_")) {
                envs[env] = process.env[env];
            }
        });
        for (const env in envs) {
            envs[env.replace("NEXT_PUBLIC_", "")] = envs[env];
        }

        if (!isServer) {
            console.log("Providing following environment variables during runtime: \n", envs);
            config.plugins.push(
                new webpack.DefinePlugin({
                    "process.env": JSON.stringify(envs),
                }),
            );
        }

        return config;
    },
};

module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
