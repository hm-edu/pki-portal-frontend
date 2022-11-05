export async function createP12(privateKey: string, chain: string[], password: string | null): Promise<string> {

    const forge = (await import("node-forge")).default;
    return await new Promise((resolve, reject) => {
        const encodedChain = [];
        for (const cert of chain) {
            encodedChain.push(forge.pki.certificateFromPem(cert));
        }

        const encodedPrivateKey = forge.pki.privateKeyFromPem(privateKey);
        if (!encodedPrivateKey || !encodedChain || !password) {
            reject();
        }
        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(encodedPrivateKey, encodedChain, password, { algorithm: "3des" });

        // base64-encode p12
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

        resolve(forge.util.encode64(p12Der));
    });
}