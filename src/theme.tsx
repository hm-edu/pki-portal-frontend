import { red } from "@mui/material/colors";
import { createTheme, Theme } from "@mui/material/styles";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { checkboxClasses } from "@mui/material/Checkbox";

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
    components: {
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    [`&.${checkboxClasses.checked}`]: {
                        color: "#FC5555",
                    },
                },
            },
        },
        MuiFormLabel: {
            styleOverrides: {
                "root": {
                    "&.Mui-focused": {
                        color: "#C6C6C6",
                    },
                },
            },
        },
        MuiInput: {
            styleOverrides: {
                "root": {
                    "&&:after": {
                        borderColor: "#C6C6C6",
                    },
                },
            },
        },
    },
});

export default theme;
