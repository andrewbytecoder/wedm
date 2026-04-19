import { createI18n } from 'vue-i18n';
import enCatalog from './locales/en';
import huCatalog from './locales/hu';
import { messages as shellMessages } from './messages';
import { deepMergeMessages } from './mergeLocales';

const en = deepMergeMessages(
    enCatalog.en as Record<string, unknown>,
    shellMessages.en as Record<string, unknown>,
) as Record<string, unknown>;
const hu = deepMergeMessages(
    huCatalog.hu as Record<string, unknown>,
    shellMessages.hu as Record<string, unknown>,
) as Record<string, unknown>;

export const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, hu } as never,
});
