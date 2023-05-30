import { DataGrid } from "@mui/x-data-grid";
import { FormEvent, useRef, useState } from "react";
import { ModelDomain, DomainsApi } from "../api/domains/api";
import { Configuration } from "../api/domains/configuration";
import DeleteIcon from "@mui/icons-material/Delete";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useSession } from "next-auth/react";
import { Config } from "./config";

export default function Delegation(props: { delegationDomain: ModelDomain; onClose: (domain: ModelDomain) => void }) {
    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 800,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
    };
    const [delegationDomain, setDelegationDomain] = useState(props.delegationDomain);
    const newDelegation = useRef<TextFieldProps>(null);
    const { data: session } = useSession();
    const [delegation, setDelegation] = useState(true);

    function removeDelegation(id: number, delegation: number, setDomain: (domains: ModelDomain) => void, setError: (error: boolean) => void) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DomainHost}`);
        api.domainsIdDelegationDelegationDelete(id, delegation).then((data) => {
            setDomain(data.data);
        }).catch(() => {
            setError(true);
        });
    }
    function addDelegation(id: number, user: string, setDomain: (domains: ModelDomain) => void, setError: (error: boolean) => void) {
        const cfg = new Configuration({ accessToken: session?.accessToken });
        const api = new DomainsApi(cfg, `${Config.DomainHost}`);
        const req = { "user": user };
        api.domainsIdDelegationPost(id, req).then((data) => {
            setDomain(data.data);
        }).catch(() => {
            setError(true);
        });

    }
    const delegate = (event: FormEvent<Element>) => {
        event.preventDefault();
        if (delegationDomain && delegationDomain.id) {
            addDelegation(delegationDomain.id, newDelegation.current?.value as string, setDelegationDomain, () => { return; });
        }
    };

    const rows = delegationDomain.delegations ? delegationDomain.delegations : [];

    return <Modal open={delegation} onClose={() => { setDelegation(false); props.onClose(delegationDomain); }} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                Delegationen bearbeiten
            </Typography>
            <Box sx={{ height: 600 }}>
                <DataGrid columns={[
                    { field: "user", headerName: "Nutzer", width: 280 },
                    {
                        field: "action",
                        headerName: "Aktionen",
                        sortable: false,
                        filterable: false,
                        hideable: false,
                        flex: 1,
                        renderCell: (params) => {
                            const row = (params.row);
                            const remove = (event: FormEvent<Element>) => {
                                event.preventDefault();
                                if (delegationDomain && row && delegationDomain.id && row.id) {
                                    removeDelegation(delegationDomain.id, row.id, setDelegationDomain, () => { return; });
                                }
                            };
                            return <Button color="warning" variant="outlined" startIcon={<DeleteIcon />} onClick={remove}> Löschen</Button>;
                        },
                    },
                ]} rows={rows} />
            </Box>
            <Box component="form" onSubmit={(e: FormEvent) => { delegate(e); }} sx={{ maxWidth: "300px", display: "flex", flexDirection: "column" }}>
                <TextField required label="Nutzer" inputRef={newDelegation} variant="standard" />
                <Button type="submit" color="inherit" variant="outlined" sx={{ mt: 1 }} >Füge Delegation hinzu</Button>
            </Box>

        </Box>
    </Modal>;
}