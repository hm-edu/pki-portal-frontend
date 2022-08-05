import { AccountInfo, IPublicClientApplication, AuthenticationResult } from "@azure/msal-browser";
import { useMsal, useAccount } from "@azure/msal-react";

import { DataGrid } from "@mui/x-data-grid";
import React, { FormEvent, useCallback, useRef, useState } from "react";
import { ModelDomain, DomainsApi } from "../../api/domains/api";
import { Configuration } from "../../api/domains/configuration";
import { authorize } from "../../auth/api";
import { Config } from "../../config";
import DeleteIcon from "@mui/icons-material/Delete";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

function removeDelegation(id: number, delegation: number, account: AccountInfo, instance: IPublicClientApplication, setDomain: (domains: ModelDomain) => void, setError: (error: boolean) => void) {
    authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"], (response: AuthenticationResult) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            api.domainsIdDelegationDelegationDelete(id, delegation).then((data) => {
                setDomain(data.data);
            }).catch(() => {
                setError(true);
            });
        }
    }, () => {
        setError(true);
    });
}
function addDelegation(id: number, user: string, account: AccountInfo, instance: IPublicClientApplication, setDomain: (domains: ModelDomain) => void, setError: (error: boolean) => void) {
    authorize(account, instance, ["api://1d9e1166-1c48-4cb2-a65e-21fa9dd384c7/Domains", "email"], (response: AuthenticationResult) => {
        if (response) {
            const cfg = new Configuration({ accessToken: response.accessToken });
            const api = new DomainsApi(cfg, `https://${Config.DOMAIN_HOST}`);
            const req = { "user": user };
            api.domainsIdDelegationPost(id, req).then((data) => {
                setDomain(data.data);
            }).catch(() => {
                setError(true);
            });
        }
    }, () => {
        setError(true);
    });
}

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
    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});
    const [delegation, setDelegation] = useState(true);

    const delegate = useCallback((event: FormEvent<Element>) => {
        event.preventDefault();
        if (account && delegationDomain && delegationDomain.id) {
            addDelegation(delegationDomain.id, newDelegation.current?.value as string, account, instance, setDelegationDomain, () => { return; });
        }
    }, [account, instance, delegationDomain]);

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
                            const remove = useCallback((event: FormEvent<Element>) => {
                                event.preventDefault();
                                if (account && delegationDomain && row && delegationDomain.id && row.id) {
                                    removeDelegation(delegationDomain.id, row.id, account, instance, setDelegationDomain, () => { return; });
                                }
                            }, [account, instance]);
                            return <Button color="warning" variant="outlined" startIcon={<DeleteIcon />} onClick={remove}> Löschen</Button>;
                        },
                    },
                ]} rows={rows} />
            </Box>
            <Box component="form" onSubmit={delegate} sx={{ maxWidth: "300px", display: "flex", flexDirection: "column" }}>
                <TextField required label="Nutzer" inputRef={newDelegation} variant="standard" />
                <Button type="submit" color="inherit" variant="outlined" sx={{ mt: 1 }} >Füge Delegation hinzu</Button>
            </Box>

        </Box>
    </Modal>;
}