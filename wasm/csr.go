//go:build js && wasm
// +build js,wasm

package main

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"errors"
	"syscall/js"
)

func main() {
	done := make(chan struct{}, 0)

	global := js.Global()

	generateCSRFunc := js.FuncOf(generateCSR)
	defer generateCSRFunc.Release()
	global.Set("generateCSR", generateCSRFunc)

	<-done
}

func generatePrivateKey(keyType string) (interface{}, string, error) {
	var key bytes.Buffer
	var privKey interface{}
	var err error
	switch keyType {
	case "rsa":
		privKey, err = rsa.GenerateKey(rand.Reader, 4096)
		if err != nil {
			return nil, "", err
		}
	case "ecdsa":
		privKey, err = ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		if err != nil {
			return nil, "", err
		}
	default:
		return nil, "", errors.New("unsupported key type")
	}
	keyDer, err := x509.MarshalPKCS8PrivateKey(privKey)
	if err != nil {
		return nil, "", err
	}

	keyBlock := pem.Block{
		Type:  "PRIVATE KEY",
		Bytes: keyDer,
	}
	err = pem.Encode(&key, &keyBlock)
	if err != nil {
		return nil, "", err
	}
	return privKey, key.String(), nil

}

func generateCSR(this js.Value, args []js.Value) interface{} {
	keyType := args[1].String()
	callback := args[2]
	var sans []string
	err := json.Unmarshal([]byte(args[0].String()), &sans)
	if err != nil {
		callback.Invoke(err.Error(), nil)
		return js.Undefined()
	}
	req := &x509.CertificateRequest{
		Subject: pkix.Name{
			CommonName: sans[0],
		},
		DNSNames: sans,
	}
	priv, privString, err := generatePrivateKey(keyType)
	if err != nil {
		callback.Invoke(err.Error(), nil)
		return js.Undefined()
	}
	data, err := x509.CreateCertificateRequest(rand.Reader, req, priv)
	if err != nil {
		callback.Invoke(err.Error(), nil)
		return js.Undefined()
	}
	var csr bytes.Buffer
	err = pem.Encode(&csr, &pem.Block{Type: "CERTIFICATE REQUEST", Bytes: data})
	if err != nil {
		callback.Invoke(err.Error(), privString, nil)
	} else {
		callback.Invoke(nil, privString, csr.String())
	}

	return js.Undefined()
}
