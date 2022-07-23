import { red } from "@mui/material/colors";
import { createTheme, Theme } from "@mui/material/styles";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// A custom theme for this app
const theme: Theme = createTheme({
    palette: {
        primary: {
            main: "#FFFFFF",
        },
        secondary: {
            main: "#FC5555",
        },
        error: {
            main: red.A400,
        },
    }, shape: {
        borderRadius: 0,
    }, 
});

export default theme;
