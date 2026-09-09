export async function createP12(privateKey: string, chain: Array<string>, password: string, type: "ecdsa" | "rsa"): Promise<string> {
    const forge = (await import("node-forge")).default;
    type Asn1PrivateKey = Parameters<typeof forge.pki.privateKeyFromAsn1>[0];
    type ParsedPrivateKey = ReturnType<typeof forge.pki.privateKeyFromAsn1>;
    type EcdsaCapableForge = typeof forge & {
        ecdsa: {
            privateKeyFromAsn1: (obj: Asn1PrivateKey) => ParsedPrivateKey;
        };
    };
    return await new Promise((resolve, reject) => {
        const encodedChain: Array<ReturnType<typeof forge.pki.certificateFromPem>> = [];
        for (const cert of chain) {
            encodedChain.push(forge.pki.certificateFromPem(cert));
        }
        let encodedPrivateKey: ParsedPrivateKey | null = null;
        if (type == "ecdsa") {
            const msg = forge.pem.decode(privateKey)[0];
            if (!msg) {
                reject(new Error("Could not decode private key"));
                return;
            }
            const obj = forge.asn1.fromDer(msg.body);
            encodedPrivateKey = (forge as EcdsaCapableForge).ecdsa.privateKeyFromAsn1(obj);
        } else {
            encodedPrivateKey = forge.pki.privateKeyFromPem(privateKey);
        }
        if (!encodedPrivateKey) {
            reject(new Error("Could not encode keys"));
            return;
        }
        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(encodedPrivateKey, encodedChain, password, { algorithm: "3des" });

        // base64-encode p12
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
        resolve(forge.util.encode64(p12Der));
    });
}