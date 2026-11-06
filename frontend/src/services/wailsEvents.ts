import { Events } from '@wailsio/runtime';

export function EventsOn<T = unknown>(
    name: string,
    callback: (data: T) => void,
): () => void {
    return Events.On(name, (event) => callback(event.data as T));
}
