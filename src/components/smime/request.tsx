/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Button } from "@mui/material";
import * as forge from "node-forge";
import React from "react";

export class CSRBundle {
    constructor(public csr: string, public privateKey: string) { }
}

export class CSRBuilder {

    build() : Promise<CSRBundle> {
        return new Promise((resolve, reject) => {
            const KEY_SIZE = 4096;
            forge.pki.rsa.generateKeyPair(
                { bits: KEY_SIZE, workers: -1 },
                (err, keys) => {
                    if (err) {
                        reject(err);
                    } else {
                        try {
                            const csr = this.createCSR(keys);
                            const pkcs10PEM = forge.pki.certificationRequestToPem(csr);
                            const privateKey = forge.pki.privateKeyToPem(keys.privateKey);
                            resolve(new CSRBundle(pkcs10PEM, privateKey));
                        } catch (err) {
                            reject(err);
                        }
                    }
                },
            );
        });
    }

    createCSR(keys: forge.pki.rsa.KeyPair) {
        const csr = forge.pki.createCertificationRequest();
        csr.publicKey = keys.publicKey;
        // sign certification request
        csr.sign(keys.privateKey, forge.md.sha256.create());
        return csr;
    }
}

export function checkPEM(pem: string) {
    const pattern = /^-----BEGIN [ A-Z]+-----\r?\n([A-Za-z0-9+/]{64}\r?\n)*[A-Za-z0-9+/]{0,64}={0,3}\r?\n-----END [ A-Z]+-----\r?\n$/;

    if (!pem.match(pattern)) {
        return false;
    }
    return true;
}

export function createP12(privateKey: string, chain: string[], password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const encodedChain = [];
        for (const cert of chain) {
            checkPEM(cert);
            encodedChain.push(forge.pki.certificateFromPem(cert));
        }

        const encodedPrivateKey = forge.pki.privateKeyFromPem(privateKey);
        if (!encodedPrivateKey || !encodedChain || !password) {
            reject();
        }
        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(encodedPrivateKey, encodedChain, password);

        // base64-encode p12
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

        resolve(forge.util.encode64(p12Der));
    });
}

export default function SMIMEGenerator() {

    const create = async () => {
        const r = new CSRBuilder();
        r.build().then(async (x) => {
            //TODO: Call backend
            const pubKey = "";
            const p12 = await createP12(x.privateKey, [pubKey], "Test");
            console.log(p12); console.log(x);
        }).catch((y) => { console.error(y); });

    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return <div> <h1>Herzlich Willkommen</h1> <Button onClick={create}>Generiere Zertifikat</Button> </div>;
}