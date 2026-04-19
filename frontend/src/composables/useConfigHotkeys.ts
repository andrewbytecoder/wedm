import { onMounted, onUnmounted, type Ref } from 'vue';
import mousetrap from 'mousetrap';

export function useConfigHotkeys(opts: {
    onSave: () => void;
    helpOpen: Ref<boolean>;
}) {
    let mt: ReturnType<typeof mousetrap> | null = null;

    onMounted(() => {
        mt = mousetrap(document.body);
        mt.bind(['mod+s', 'ctrl+s'], (e) => {
            e.preventDefault();
            opts.onSave();
        });
        mt.bind(['mod+h', 'ctrl+h'], (e) => {
            e.preventDefault();
            opts.helpOpen.value = !opts.helpOpen.value;
        });
    });

    onUnmounted(() => {
        mt?.unbind(['mod+s', 'ctrl+s', 'mod+h', 'ctrl+h']);
    });
}
