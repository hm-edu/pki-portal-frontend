"use client";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { Box, Button, TextField } from "@mui/material";
import * as Sentry from "@sentry/nextjs";
import { type Session } from "next-auth";
import { type FormEvent, useState } from "react";

interface EabCreateFormProps {
    session: Session | null;
    createEABToken: (comment: string) => Promise<void>;
}

const EabCreateForm = ({ session, createEABToken }: EabCreateFormProps) => {
    const [newComment, setNewComment] = useState("");

    const handleSubmit = (e: FormEvent<Element>) => {
        e.preventDefault();
        if (newComment) {
            createEABToken(newComment).then( () => {
                setNewComment("");
            }).catch( (e: Error) => {
                Sentry.captureException(e);
            });
        }
    };

    return <Box component="form" sx={{ maxWidth: "100%", display: "flex", flexDirection: "column" }} onSubmit={handleSubmit}>
        <TextField
            label="Kommentar (z.B. DNS-Name von Server)"
            value={newComment}
            variant="standard"
            required
            onChange={(e) => setNewComment(e.target.value)}
        />
        <Button type="submit" id="new" variant="contained" disabled={!session} color="success" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1 }}>
            Erstelle neuen Token
        </Button>
    </Box>;
};

export default EabCreateForm;
