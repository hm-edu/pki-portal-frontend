import * as pkijs from "pkijs";
import { Buffer } from "buffer";

export class CSRBundle {
    constructor(public csr: string, public privateKey: string) { }
}

export class CsrBuilder {

    async build(type: "ecdsa" | "rsa", fqdns?: string[], strength?: string | number): Promise<CSRBundle> {
        const pkcs10 = new pkijs.CertificationRequest();
        const crypto = pkijs.getCrypto(true);
        pkcs10.attributes = [];
        let algorithm: pkijs.CryptoEngineAlgorithmParams;
        switch (type) {
            case "ecdsa":
                algorithm = pkijs.getAlgorithmParameters("ECDSA", "generateKey");
                (algorithm.algorithm as EcKeyAlgorithm).namedCurve = "P-256";
                break;
            case "rsa":
                algorithm = pkijs.getAlgorithmParameters("RSASSA-PKCS1-v1_5", "generateKey");
                if (strength && typeof strength === "number") {
                    (algorithm.algorithm as RsaKeyAlgorithm).modulusLength = strength;
                } else {
                    (algorithm.algorithm as RsaKeyAlgorithm).modulusLength = 3072;
                }
                break;
        }

        const { privateKey, publicKey } = await crypto.generateKey(algorithm.algorithm as Algorithm, true, algorithm.usages) as Required<CryptoKeyPair>;
        await pkcs10.subjectPublicKeyInfo.importKey(publicKey);

        if (fqdns) {
            const altNames = new pkijs.GeneralNames({
                names: fqdns.map(fqdn => new pkijs.GeneralName({
                    type: 2,
                    value: fqdn,
                })),
            });
            pkcs10.attributes.push(new pkijs.Attribute({
                type: "1.2.840.113549.1.9.14",
                values: [(new pkijs.Extensions({
                    extensions: [
                        new pkijs.Extension({
                            extnID: "2.5.29.17",
                            critical: false,
                            extnValue: altNames.toSchema().toBER(false),
                        }),
                    ],
                })).toSchema()],
            }));
        }

        // Signing final PKCS#10 request
        await pkcs10.sign(privateKey, "sha-256");

        return { csr: this.convertBinaryToPem(pkcs10.toSchema().toBER(false), "CERTIFICATE REQUEST"), privateKey: this.convertBinaryToPem(await crypto.exportKey("pkcs8", privateKey), "PRIVATE KEY") };
    }

    arrayBufferToBase64String(arrayBuffer: ArrayBuffer): string {
        return Buffer.from(arrayBuffer).toString("base64");
    }

    convertBinaryToPem(binaryData: ArrayBuffer, label: string) {
        const base64Cert = this.arrayBufferToBase64String(binaryData);
        let pemCert = "-----BEGIN " + label + "-----\r\n";
        let nextIndex = 0;
        while (nextIndex < base64Cert.length) {
            if (nextIndex + 64 <= base64Cert.length) {
                pemCert += base64Cert.substring(nextIndex, nextIndex + 64) + "\r\n";
            } else {
                pemCert += base64Cert.substring(nextIndex) + "\r\n";
            }
            nextIndex += 64;
        }
        pemCert += "-----END " + label + "-----\r\n";
        return pemCert;
    }
}