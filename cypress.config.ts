import { defineConfig } from "cypress";

export default defineConfig({
    video: true,
    videosFolder: "cypress/videos",
    videoCompression: 15,
    fixturesFolder: false,
    e2e: {
        setupNodeEvents() {
            // implement node event listeners here
        },
        viewportHeight: 1000,
        viewportWidth: 1280,
        baseUrl: "http://localhost:3000",
        chromeWebSecurity: false,
    },
    retries: {
        runMode: 10,
    },
});
