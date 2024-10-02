"use client";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { Box, Button, TextField } from "@mui/material";
import { Session } from "next-auth";
import { FormEvent, useState } from "react";

interface EabCreateFormProps {
    session: Session | null;
    createEABToken: (comment: string) => void;
}

const EabCreateForm = ({ session, createEABToken }: EabCreateFormProps) => {
    const [newComment, setNewComment] = useState("");

    const handleSubmit = (e: FormEvent<Element>) => {
        e.preventDefault();
        if (newComment) {
            createEABToken(newComment);
            setNewComment("");
        }
    };

    return <Box component="form" sx={{ maxWidth: "100%", display: "flex", flexDirection: "column" }} onSubmit={handleSubmit}>
        <TextField
            label="Optionaler Kommentar"
            value={newComment}
            variant="standard"
            onChange={(e) => setNewComment(e.target.value)}
        />
        <Button type="submit" id="new" variant="contained" disabled={!session} color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }}>
            Erstelle neuen Token
        </Button>
    </Box>;
};

export default EabCreateForm;
