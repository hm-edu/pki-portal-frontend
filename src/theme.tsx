import { red } from "@mui/material/colors";
import { createTheme, Theme } from "@mui/material/styles";
import { checkboxClasses } from "@mui/material/Checkbox";
import { deDE } from "@mui/x-data-grid";
import createCache from "@emotion/cache";

// A custom theme for this app
export const theme: Theme = createTheme({
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
    typography: {
        h1: {
            fontSize: "2rem",
            fontWeight: 700,
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
        },
        h2: {
            fontSize: "1.5rem",
            fontWeight: 500,
            paddingBottom: "0.5rem",
        },
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
        MuiButton: {
            styleOverrides: {
                "root": ({ ownerState }) => ({
                    ":hover": {
                        ...(ownerState.color === "inherit" && ownerState.variant === "outlined" && {
                            backgroundColor: "#3E46D9",
                            color: "#FFFFFF",
                            borderColor: "#FFFFFF",
                        }),
                    },
                }),
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

export const dataGridStyle = {
    "& .MuiDataGrid-cell:focus": { outline: "none" },
    "& .MuiDataGrid-row.Mui-selected": { background: "#C6C6C6" },
    "& .MuiDataGrid-row.Mui-selected:hover": { background: "#C6C6C6" },
};

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

const isBrowser = typeof document !== "undefined";

// On the client side, Create a meta tag at the top of the <head> and set it as insertionPoint.
// This assures that MUI styles are loaded first.
// It allows developers to easily override MUI styles with other styling solutions, like CSS modules.
export function createEmotionCache() {
    let insertionPoint;
    if (isBrowser) {
        const emotionInsertionPoint = document.querySelector("meta[name=\"emotion-insertion-point\"]") as HTMLElement;
        insertionPoint = emotionInsertionPoint ?? undefined;
    }

    return createCache({ key: "mui-style", insertionPoint });
}
