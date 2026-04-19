import { i18n } from '@/i18n';

export default class Messages {
    public static error(error: string, translate = false) {
        return {
            text: `${i18n.global.t('common.messages.error')}.
            Error: ${translate ? i18n.global.t(error) : error}`,
            color: 'error',
            show: true,
        };
    }

    public static success(message?: string) {
        const msg = i18n.global.t(message || 'common.messages.success');
        return {
            text: msg,
            color: 'success',
            show: true,
        };
    }

    public static message(msg: string) {
        return {
            text: i18n.global.t(msg),
            color: 'info',
            show: true,
        };
    }
}
