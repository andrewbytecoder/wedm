export {};

declare global {
    interface Window {
        go: {
            main: {
                App: {
                    GetAppVersion(): Promise<string>;
                    GetPackageMetadata(): Promise<string>;
                    GetWhatsNewMarkdown(): Promise<string>;
                    ReadTextFile(path: string): Promise<string>;
                    WriteTextFile(path: string, content: string): Promise<void>;
                    OpenImportConfigPath(): Promise<string>;
                    OpenExportConfigPath(defaultName: string): Promise<string>;
                    OpenSSLFilePath(): Promise<string>;
                    OpenExternalURL(url: string): Promise<void>;
                    EtcdPing(configJSON: string): Promise<string>;
                    EtcdMemberList(configJSON: string): Promise<string>;
                    EtcdListKeys(configJSON: string, prefix: string): Promise<string>;
                    EtcdGetKey(configJSON: string, key: string): Promise<string>;
                    EtcdPutKey(
                        configJSON: string,
                        key: string,
                        value: string,
                        leaseSeconds: number,
                    ): Promise<string>;
                    EtcdDeleteKeys(configJSON: string, keysJSON: string): Promise<string>;
                };
            };
        };
    }
}
