import * as WailsApp from '../../wailsjs/go/main/App';

/** Thin wrapper over tGo `App` bindings (replaces Electron `ipcRenderer` / `remoe`). */
export const desktop = {
    getAppVersion: () => WailsApp.GetAppVersion(),
    getPackageMetadataJSON: () => WailsApp.GetPackageMetadata(),
    getWhatsNewMarkdown: () => WailsApp.GetWhatsNewMarkdown(),
    readTextFile: (path: string) => WailsApp.ReadTextFile(path),
    writeTextFile: (path: string, content: string) =>
        WailsApp.WriteTextFile(path, content),
    openImportConfigPath: () => WailsApp.OpenImportConfigPath(),
    openExportConfigPath: (defaultName: string) =>
        WailsApp.OpenExportConfigPath(defaultName),
    openSSLFilePath: () => WailsApp.OpenSSLFilePath(),
    openExternalURL: (url: string) => WailsApp.OpenExternalURL(url),
};
