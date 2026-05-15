<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EventsOn } from '../../../wailsjs/runtime';
import {
    etcdPutKeyTx,
    etcdStartKeyRevisionWatch,
    etcdStopKeyRevisionWatch,
} from '@/services/etcdBridge';
import { useAppStore } from '@/stores/app';

export type RevRow = {
    rid: number;
    previousValue: string;
    version: number;
    createRevision: number;
    modRevision: number;
    type: string;
};

const props = defineProps<{
    open: boolean;
    mode: 'create' | 'edit';
    initialKey: string;
    initialValue: string;
}>();

const emit = defineEmits<{ close: []; saved: [] }>();

const { t } = useI18n();
const app = useAppStore();
const saving = ref(false);
const keyField = ref('');
const valueField = ref('');
const ttlField = ref<number | string>(0);
const formValid = ref(false);
const revisions = ref<RevRow[]>([]);
const watchError = ref('');
const revPanel = ref<number | null>(null);

let offRev: (() => void) | undefined;
const watchedKey = ref('');
let nextRid = 1;

watch(
    () => [props.open, props.mode, props.initialKey] as const,
    ([open, mode, key]) => {
        offRev?.();
        offRev = undefined;
        void etcdStopKeyRevisionWatch();
        revisions.value = [];
        watchError.value = '';
        watchedKey.value = '';
        if (!open) {
            return;
        }
        keyField.value = props.initialKey;
        valueField.value = props.initialValue;
        ttlField.value = 0;
        if (mode === 'edit' && key) {
            nextRid = 1;
            watchedKey.value = key;
            void etcdStartKeyRevisionWatch(key);
            offRev = EventsOn('etcd:keyrev', (payload: string) => {
                try {
                    const o = JSON.parse(payload) as Record<string, unknown>;
                    if (o.error != null) {
                        watchError.value = String(o.error);
                        return;
                    }
                    if (String(o.etcdKey ?? '') !== watchedKey.value) {
                        return;
                    }
                    const row: RevRow = {
                        rid: nextRid++,
                        previousValue: String(o.value ?? ''),
                        version: Number(o.version),
                        createRevision: Number(o.createRevision),
                        modRevision: Number(o.modRevision),
                        type: String(o.type ?? ''),
                    };
                    revisions.value = [row, ...revisions.value].slice(0, 200);
                } catch {
                    /* ignore malformed payloads */
                }
            });
        }
    },
    { immediate: true },
);

const requiredRule = (v: unknown) =>
    (typeof v === 'string' && v.trim().length > 0) || t('common.validation.required');

const ttlRules = [
    (v: unknown) => {
        const n = Number(v);
        return Number.isInteger(n) || t('keyEditor.messages.integerTtl');
    },
    (v: unknown) => {
        const n = Number(v);
        if (Number.isNaN(n)) {
            return true;
        }
        return n >= 0 || t('keyEditor.messages.minValue');
    },
    (v: unknown) => {
        const n = Number(v);
        return n <= 9000000000 || t('keyEditor.messages.maxValue', { max: 9000000000 });
    },
];

const revHeaders = computed(() => [
    { title: t('keyEditor.columns.key'), key: 'previousValue', sortable: false },
    { title: t('keyEditor.columns.version'), key: 'version', sortable: false },
    { title: t('keyEditor.columns.type'), key: 'type', sortable: false },
    { title: t('keyEditor.columns.createRev'), key: 'createRevision', sortable: false },
    { title: t('keyEditor.columns.modRev'), key: 'modRevision', sortable: false },
]);

async function copyValue() {
    try {
        await navigator.clipboard.writeText(valueField.value);
        app.showMessage(t('common.messages.copyClipboardSuccess'), 'success');
    } catch {
        app.showMessage(t('common.messages.copyClipboardSuccessError'), 'error');
    }
}

function revertToRevision(_e: unknown, ctx: { item: RevRow }) {
    valueField.value = ctx.item.previousValue;
}

async function submit() {
    if (!formValid.value) {
        return;
    }
    if (!keyField.value.trim() || valueField.value === '') {
        app.showMessage(t('common.validation.required'), 'error');
        return;
    }
    const ttl = Number(ttlField.value);
    if (!Number.isInteger(ttl) || ttl < 0 || ttl > 9000000000) {
        app.showMessage(t('keyEditor.messages.integerTtl'), 'error');
        return;
    }
    const leaseSeconds = props.mode === 'create' && ttl > 0 ? ttl : 0;
    saving.value = true;
    try {
        const res = await etcdPutKeyTx(
            keyField.value.trim(),
            valueField.value,
            leaseSeconds,
            props.mode === 'create',
        );
        if (props.mode === 'create' && res.succeeded === false) {
            app.showMessage(t('keyEditor.messages.duplicateKey'), 'error');
            return;
        }
        app.showMessage(t('common.messages.success'), 'success');
        emit('saved');
        if (props.mode === 'create') {
            keyField.value = '';
            valueField.value = '';
            ttlField.value = 0;
        }
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        saving.value = false;
    }
}

const heading = computed(() =>
    props.mode === 'create' ? t('common.actions.create.label') : t('keyManager.actions.edit'),
);

onUnmounted(() => {
    offRev?.();
    void etcdStopKeyRevisionWatch();
});

defineExpose({ submit });
</script>

<template>
    <v-card v-show="open" variant="outlined" class="key-editor-panel">
        <v-card-title class="text-subtitle-1">{{ heading }}</v-card-title>
        <v-card-text>
            <v-form v-model="formValid" @submit.prevent="submit">
                <v-text-field
                    v-model="keyField"
                    density="comfortable"
                    :label="t('keyEditor.fields.key.label')"
                    :placeholder="t('keyEditor.fields.key.placeholder')"
                    :readonly="mode === 'edit'"
                    :rules="[requiredRule]"
                    class="mb-2"
                />
                <v-text-field
                    v-model="valueField"
                    density="comfortable"
                    :label="t('keyEditor.fields.value.label')"
                    :placeholder="t('keyEditor.fields.value.placeholder')"
                    :rules="[requiredRule]"
                    append-inner-icon="mdi-content-copy"
                    class="mb-2"
                    @click:append-inner="copyValue"
                />
                <v-text-field
                    v-if="mode === 'create'"
                    v-model.number="ttlField"
                    type="number"
                    density="comfortable"
                    :label="t('keyEditor.fields.ttl.label')"
                    :placeholder="t('keyEditor.fields.ttl.placeholder')"
                    :hint="t('keyEditor.fields.ttl.tooltip')"
                    persistent-hint
                    :rules="ttlRules"
                    class="mb-2"
                />
                <p v-if="mode === 'edit'" class="text-caption text-medium-emphasis mb-2">
                    {{ t('keyEditor.messages.revisionsLive') }}
                </p>
                <v-alert v-if="watchError" type="warning" variant="tonal" density="compact" class="mb-2" closable>
                    {{ watchError }}
                </v-alert>
                <div class="d-flex flex-wrap ga-2 mb-3">
                    <v-btn color="primary" :loading="saving" type="submit" :disabled="!formValid">
                        {{ mode === 'create' ? t('common.actions.create.label') : t('common.actions.save') }}
                    </v-btn>
                    <v-btn variant="text" @click="emit('close')">{{ t('common.actions.close.label') }}</v-btn>
                </div>
            </v-form>

            <v-expansion-panels v-if="mode === 'edit' && revisions.length" v-model="revPanel" class="mt-2">
                <v-expansion-panel>
                    <v-expansion-panel-title>
                        {{ t('keyEditor.subtitle') }} ({{ revisions.length }})
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-data-table
                            density="compact"
                            :headers="revHeaders"
                            :items="revisions"
                            item-value="rid"
                            class="elevation-0 revision-table"
                            @click:row="revertToRevision"
                        />
                        <p class="text-caption text-medium-emphasis mt-2">
                            {{ t('keyEditor.messages.revisionsClickRow') }}
                        </p>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.revision-table :deep(tbody tr) {
    cursor: pointer;
}
</style>
