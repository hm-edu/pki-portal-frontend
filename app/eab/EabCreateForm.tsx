"use client";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { Box, Button, TextField } from "@mui/material";
import { TextFieldProps } from "@mui/material/TextField";
import { Session } from "next-auth";
import { FormEvent, useRef } from "react";

interface EabCreateFormProps {
    session: Session | null;
    createEABToken: (comment: string) => void;
}

const EabCreateForm = ({ session, createEABToken }: EabCreateFormProps) => {
    const newComment = useRef<TextFieldProps>(null);

    const handleSubmit = (e: FormEvent<Element>) => {
        e.preventDefault();
        if (newComment.current?.value) {
            createEABToken(newComment.current.value as string);
            newComment.current.value = "";
        }
    };

    return <Box component="form" sx={{ maxWidth: "100%", display: "flex", flexDirection: "column" }} onSubmit={handleSubmit}>
        <TextField
            slotProps={{ htmlInput: { pattern: "[a-zA-Z0-9-_.: üäöÄÖÜß]*" } }}
            label="Optionaler Kommentar"
            inputRef={newComment}
            variant="standard"
        />
        <Button type="submit" id="new" variant="contained" disabled={!session} color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }}>
            Erstelle neuen Token
        </Button>
    </Box>;
};

export default EabCreateForm;
