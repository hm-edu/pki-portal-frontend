import { red } from "@mui/material/colors";
import { createTheme, Theme } from "@mui/material/styles";
import { checkboxClasses } from "@mui/material/Checkbox";
import { deDE } from "@mui/x-data-grid";
import { withRouter } from "next/router";

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
