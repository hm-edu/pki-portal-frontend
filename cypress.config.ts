import { defineConfig } from "cypress";
import codeCoverageTask from "@cypress/code-coverage/task";

export default defineConfig({
    videoCompression: 15,
    e2e: {
        viewportHeight: 1000,
        viewportWidth: 1280,
        setupNodeEvents(on, config) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            codeCoverageTask(on, config);
            return config;
        },
        baseUrl: "http://localhost:3000",
        chromeWebSecurity: false,
    },
    component: {
        devServer: {
            framework: "next",
            bundler: "webpack",
        },
        setupNodeEvents(on, config) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            codeCoverageTask(on, config);
            return config;
        },
    },
});