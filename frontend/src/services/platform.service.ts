import type { TranslateResult } from 'vue-i18n';
import { marked } from 'marked';

export class PlatformService {
    private platform: string;

    constructor() {
        this.platform =
            typeof navigator !== 'undefined' ? navigator.platform : '';
    }

    public getMeta(): string {
        return this.platform.toLowerCase().includes('mac') ? 'CMD' : 'CTRL';
    }

    public getLabel(meta: boolean, ...keys: string[]): string {
        return (meta ? this.getMeta() : '') + keys.join(' ');
    }

    public getHelp(key: TranslateResult): string {
        const raw = key
            .toString()
            .replace(/[ ]{2,}/g, '')
            .trim();
        return marked.parse(raw) as string;
    }
}
