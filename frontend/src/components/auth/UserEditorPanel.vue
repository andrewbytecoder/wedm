<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Mousetrap from 'mousetrap';
import {
    etcdAuthUserAdd,
    etcdAuthUserChangePassword,
    etcdAuthUserGet,
    etcdAuthUserGrantRole,
    etcdAuthUserRevokeRole,
} from '@/services/etcdBridge';
import { PlatformService } from '@/services/platform.service';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const props = defineProps<{
    open: boolean;
    mode: 'create' | 'edit';
    /** Set when mode is edit */
    userName: string;
    allRoles: string[];
}>();

const emit = defineEmits<{
    close: [];
    saved: [];
}>();

const { t } = useI18n();
const app = useAppStore();
const settings = useSettingsStore();
const platform = new PlatformService();

const name = ref('');
const password = ref('');
const pwcheck = ref('');
const ownRoles = ref<string[]>([]);
const initialRoles = ref<string[]>([]);
const saving = ref(false);
const showPassword = ref(false);
const helpPanel = ref<number | null>(null);

function validPassword(pw: string): boolean {
    const p = settings.users.pattern;
    if (p) {
        try {
            return new RegExp(p).test(pw);
        } catch {
            return false;
        }
    }
    return /^[^\s]{8,16}$/.test(pw) && /[0-9]/.test(pw) && /[A-Z]/.test(pw);
}

const nameErrors = computed(() => {
    const n = name.value.trim();
    if (!n) {
        return [t('common.validation.required')];
    }
    if (!/^[a-zA-Z0-9]+$/.test(n)) {
        return [t('common.validation.alphanumeric')];
    }
    return [] as string[];
});

const passwordErrors = computed(() => {
    const pw = password.value;
    const ck = pwcheck.value;
    if (props.mode === 'create') {
        if (!pw) {
            return [t('common.validation.required')];
        }
        if (!validPassword(pw)) {
            return [t('userEditor.messages.invalid')];
        }
        if (pw !== ck) {
            return [t('userEditor.messages.pwmatch')];
        }
        return [] as string[];
    }
    if (!pw && !ck) {
        return [] as string[];
    }
    if (pw !== ck) {
        return [t('userEditor.messages.pwmatch')];
    }
    if (pw && !validPassword(pw)) {
        return [t('userEditor.messages.invalid')];
    }
    return [] as string[];
});

const formOk = computed(() => {
    if (nameErrors.value.length) {
        return false;
    }
    if (passwordErrors.value.length) {
        return false;
    }
    return true;
});

async function hydrateEdit() {
    if (props.mode !== 'edit' || !props.userName) {
        return;
    }
    try {
        const roles = await etcdAuthUserGet(props.userName);
        ownRoles.value = [...roles];
        initialRoles.value = [...roles];
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
        ownRoles.value = [];
        initialRoles.value = [];
    }
}

watch(
    () => [props.open, props.mode, props.userName] as const,
    async ([open, mode, uname]) => {
        if (!open) {
            return;
        }
        password.value = '';
        pwcheck.value = '';
        showPassword.value = false;
        helpPanel.value = null;
        if (mode === 'create') {
            name.value = '';
            ownRoles.value = [];
            initialRoles.value = [];
        } else {
            name.value = uname;
            await hydrateEdit();
        }
    },
);

async function submit() {
    if (!formOk.value) {
        return;
    }
    saving.value = true;
    try {
        if (props.mode === 'create') {
            await etcdAuthUserAdd(name.value.trim(), password.value);
            for (const r of ownRoles.value) {
                await etcdAuthUserGrantRole(name.value.trim(), r);
            }
        } else {
            if (password.value) {
                await etcdAuthUserChangePassword(props.userName, password.value);
            }
            const before = new Set(initialRoles.value);
            const after = new Set(ownRoles.value);
            for (const r of ownRoles.value) {
                if (!before.has(r)) {
                    await etcdAuthUserGrantRole(props.userName, r);
                }
            }
            for (const r of initialRoles.value) {
                if (!after.has(r)) {
                    await etcdAuthUserRevokeRole(props.userName, r);
                }
            }
        }
        app.showMessage(t('common.messages.success'), 'success');
        emit('saved');
        emit('close');
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        saving.value = false;
    }
}

function toggleHelp() {
    helpPanel.value = helpPanel.value === 0 ? null : 0;
}

function bindHotkeys() {
    Mousetrap.bind(['mod+h', 'ctrl+h'], () => {
        toggleHelp();
        return false;
    });
    Mousetrap.bind('esc', () => {
        if (props.open) {
            emit('close');
        }
        return false;
    });
    Mousetrap.bind(['mod+s', 'ctrl+s'], () => {
        if (props.open) {
            void submit();
        }
        return false;
    });
}

function unbindHotkeys() {
    Mousetrap.unbind(['mod+h', 'ctrl+h', 'esc', 'mod+s', 'ctrl+s']);
}

watch(
    () => props.open,
    (open) => {
        unbindHotkeys();
        if (open) {
            bindHotkeys();
        }
    },
);

onMounted(() => {
    if (props.open) {
        bindHotkeys();
    }
});

onUnmounted(() => {
    unbindHotkeys();
});
</script>

<template>
    <v-card v-if="open" variant="outlined">
        <v-expansion-panels v-model="helpPanel" class="mb-2">
            <v-expansion-panel>
                <v-expansion-panel-title>{{ t('userEditor.title') }} — {{ t('common.help.tooltip') }}</v-expansion-panel-title>
                <v-expansion-panel-text>
                    <div class="markdown-help text-body-2" v-html="platform.getHelp(t('userEditor.help.text'))" />
                    <p class="text-caption mt-2">
                        <strong>{{ platform.getMeta() }} + S</strong> — {{ t('common.help.shortcuts.save') }} ·
                        <strong>{{ platform.getMeta() }} + H</strong> — {{ t('common.help.shortcuts.help') }} ·
                        <strong>Esc</strong> — {{ t('common.help.shortcuts.closeEditor') }}
                    </p>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <v-toolbar density="comfortable" flat>
            <v-toolbar-title>{{ mode === 'create' ? t('common.titles.new') : props.userName }}</v-toolbar-title>
            <v-spacer />
            <v-btn variant="text" @click="emit('close')">{{ t('common.actions.close.label') }}</v-btn>
        </v-toolbar>

        <v-card-text>
            <v-text-field
                v-model="name"
                density="comfortable"
                :readonly="mode === 'edit'"
                :label="t('userEditor.fields.name.label')"
                :placeholder="t('userEditor.fields.name.placeholder')"
                :error-messages="nameErrors"
            />
            <v-text-field
                v-model="password"
                density="comfortable"
                :type="showPassword ? 'text' : 'password'"
                :label="t('userEditor.fields.password.label')"
                :placeholder="t('userEditor.fields.password.placeholder')"
                :error-messages="passwordErrors"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
            />
            <v-text-field
                v-model="pwcheck"
                density="comfortable"
                :type="showPassword ? 'text' : 'password'"
                :label="t('userEditor.fields.pwcheck.label')"
                :placeholder="t('userEditor.fields.pwcheck.placeholder')"
            />

            <h3 class="text-subtitle-1 mt-4">{{ t('userEditor.subtitle') }}</h3>
            <v-alert v-if="!allRoles.length" type="warning" density="compact" class="mb-2">
                {{ t('userEditor.messages.norights') }}
            </v-alert>
            <v-card v-else variant="tonal" max-height="220" class="overflow-y-auto pa-2">
                <v-checkbox
                    v-for="r in allRoles"
                    :key="r"
                    v-model="ownRoles"
                    density="compact"
                    hide-details
                    :label="r"
                    :value="r"
                />
            </v-card>

            <div class="d-flex gap-2 mt-4">
                <v-btn color="primary" :disabled="!formOk" :loading="saving" @click="submit">
                    {{ mode === 'create' ? t('common.actions.create.label') : t('common.actions.save') }}
                </v-btn>
                <v-btn variant="text" @click="emit('close')">{{ t('common.actions.close.label') }}</v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.markdown-help :deep(p) {
    margin-bottom: 0.5rem;
}
.markdown-help :deep(ul) {
    margin: 0.25rem 0 0.5rem 1.25rem;
}
</style>
