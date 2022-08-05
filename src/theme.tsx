import { red } from "@mui/material/colors";
import { createTheme, Theme } from "@mui/material/styles";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { checkboxClasses } from "@mui/material/Checkbox";
import { deDE } from "@mui/x-data-grid";

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
}, deDE);

export const modalTheme = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
};
export default theme;
