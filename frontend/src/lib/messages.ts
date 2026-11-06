import { i18n } from '@/i18n';

const translateMessage = (
    i18n.global as unknown as { t: (key: string) => string }
).t;

export default class Messages {
    public static error(error: string, translate = false) {
        return {
            text: `${translateMessage('common.messages.error')}.
            Error: ${translate ? translateMessage(error) : error}`,
            color: 'error',
            show: true,
        };
    }

    public static success(message?: string) {
        const msg = translateMessage(message || 'common.messages.success');
        return {
            text: msg,
            color: 'success',
            show: true,
        };
    }

    public static message(msg: string) {
        return {
            text: translateMessage(msg),
            color: 'info',
            show: true,
        };
    }
}
