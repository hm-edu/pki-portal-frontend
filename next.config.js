/** @type {import('next').NextConfig} */

const fs = require("fs");

const { withSentryConfig } = require("@sentry/nextjs");
const download = require("download");

const sentryWebpackPluginOptions = {
    // Additional config options for the Sentry Webpack plugin. Keep in mind that
    // the following options are set automatically, and overriding them is not
    // recommended:
    //   release, url, org, project, authToken, configFile, stripPrefix,
    //   urlPrefix, include, ignore
    org: "sre",
    project: "pki-frontend",
    url: "https://sentry.hm.edu/",
    reactComponentAnnotation: {
        enabled: true,
    },
    hideSourceMaps: true,
    widenClientFileUpload: true,
    silent: true, // Suppresses all logs
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options.
};
module.exports = (phase, { defaultConfig }) => {
    let moduleExports = {
        poweredByHeader: false,
        reactStrictMode: true,
        productionBrowserSourceMaps: true,
        output: process.env.NEXT_PUBLIC_CI == "true" ? undefined : "standalone",
        compiler: {
            emotion: true,
        },
        modularizeImports: {
            "@mui/icons-material": {
                transform: "@mui/icons-material/{{member}}",
            },
        },
        webpack: (config, { webpack, isServer }) => {
            (async () => {
                if (process.env.LOGO_LARGE) {
                    fs.writeFileSync("./public/logo.png", await download(process.env.LOGO_LARGE));
                }
                if (process.env.LOGO_SMALL) {
                    fs.writeFileSync("./public/logo-small.png", await download(process.env.LOGO_SMALL));
                }
                if (process.env.FAVICON) {
                    fs.writeFileSync("./public/favicon.ico", await download(process.env.FAVICON));
                }
            })();
            const envs = {};
            Object.keys(process.env).forEach((env) => {
                if (env.startsWith("NEXT_PUBLIC_") && env != "NEXT_PUBLIC_SENTRY_DSN") {
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

            config.ignoreWarnings = [
                { module: /@opentelemetry\/instrumentation/, message: /Critical dependency/ },
                { module: /@prisma\/instrumentation/, message: /Critical dependency/ },
            ];
            return defaultConfig.webpack ? defaultConfig.webpack(config) : config;
        },
    };

    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        console.log("Sentry DSN found, enabling Sentry monitoring");
        moduleExports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
    } else {
        moduleExports = moduleExports;
    }

    return moduleExports;
};

