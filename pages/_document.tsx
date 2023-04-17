import Document, { Html, Main } from "next/document";
import createEmotionServer from "@emotion/server/create-instance";
import { createEmotionCache, theme } from "../src/theme";
import {
    getCspInitialProps,
    provideComponents,
} from "@next-safe/middleware/dist/document";

export default class MyDocument extends Document<{ emotionStyleTags: JSX.Element }> {
    render() {
        const { Head, NextScript } = provideComponents(this.props);
        return (
            <Html lang="en">
                <Head>
                    {/* PWA primary color */}
                    <meta name="theme-color" content={theme.palette.primary.main} />
                    <link rel="shortcut icon" href="/favicon.ico" />
                    <meta name="emotion-insertion-point" content="" />
                    {this.props.emotionStyleTags}
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

function computeResizeCss(): string[] {

    /* Detect CSS Animations support to detect element display/re-attach */
    let keyframeprefix = "",
        pfx = "";
    const domPrefixes = ["Webkit", "Moz", "O", "ms"];
    let cssOptions: string[] = [computeCss("")];

    for (let i = 0; i < domPrefixes.length; i++) {

        pfx = domPrefixes[i];
        keyframeprefix = "-" + pfx.toLowerCase() + "-";

        const css = computeCss(keyframeprefix);
        cssOptions = [css, ...cssOptions];
    }
    return cssOptions;

    function computeCss(keyframeprefix: string) {
        const animationName = "resizeanim";
        const animationKeyframes = "@" +
            keyframeprefix +
            "keyframes " +
            animationName +
            " { from { opacity: 0; } to { opacity: 0; } } ";
        const animationStyle = keyframeprefix + "animation: 1ms " + animationName + "; ";

        const css = (animationKeyframes ? animationKeyframes : "") +
            ".Mui-resizeTriggers { " +
            (animationStyle ? animationStyle : "") +
            "visibility: hidden; opacity: 0; } " +
            ".Mui-resizeTriggers, .Mui-resizeTriggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; z-index: -1; } .Mui-resizeTriggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }";
        return css;
    }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
    // Resolution order
    //
    // On the server:
    // 1. app.getInitialProps
    // 2. page.getInitialProps
    // 3. document.getInitialProps
    // 4. app.render
    // 5. page.render
    // 6. document.render
    //
    // On the server with error:
    // 1. document.getInitialProps
    // 2. app.render
    // 3. page.render
    // 4. document.render
    //
    // On the client
    // 1. app.getInitialProps
    // 2. page.getInitialProps
    // 3. app.render
    // 4. page.render

    const originalRenderPage = ctx.renderPage;

    // You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
    // However, be aware that it can have global side effects.
    const cache = createEmotionCache();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { extractCriticalToChunks } = createEmotionServer(cache);

    ctx.renderPage = () =>
        originalRenderPage({
            enhanceApp: (App) =>
                function EnhanceApp(props) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    return <App emotionCache={cache} {...props} />;
                },
        });
    const initialProps = await getCspInitialProps({ ctx, trustifyStyles: true, hashRawCss: computeResizeCss() });
    // This is important. It prevents Emotion to render invalid HTML.
    // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
    const emotionStyles = extractCriticalToChunks(initialProps.html);
    const emotionStyleTags = emotionStyles.styles.map((style) => (
        <style
            data-emotion={`${style.key} ${style.ids.join(" ")}`}
            key={style.key}
            dangerouslySetInnerHTML={{ __html: style.css }}
        />
    ));

    return {
        ...initialProps,
        emotionStyleTags,
    };
};
