export interface KeyPair {
    private: string;
    public: string | undefined;
    pkcs12: string | undefined;
}