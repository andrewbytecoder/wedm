import { createI18n } from 'vue-i18n';
import enCatalog from './locales/en';
import zhCatalog from './locales/zh';
import { messages as shellMessages } from './messages';
import { deepMergeMessages } from './mergeLocales';

const en = deepMergeMessages(
    enCatalog.en as Record<string, unknown>,
    shellMessages.en as Record<string, unknown>,
) as Record<string, unknown>;
const zh = deepMergeMessages(
    zhCatalog.zh as Record<string, unknown>,
    zhCatalog.zh as Record<string, unknown>,
) as Record<string, unknown>;

export const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh } as never,
});
