<script setup lang="ts">
import type { KeyTreeNode } from '@/lib/buildKeyTree';
import KeyTreeBranch from './KeyTreeBranch.vue';

defineProps<{
    nodes: KeyTreeNode[];
    expanded: Record<number, boolean>;
    selectedKeys: string[];
}>();

const emit = defineEmits<{
    'toggle-expand': [id: number];
    'toggle-select': [key: string];
    edit: [row: { key: string; value: string; tooltip: string }];
    remove: [row: { key: string; value: string; tooltip: string }];
    touch: [row: { key: string; value: string; tooltip: string }];
}>();

function isFolder(n: KeyTreeNode): boolean {
    return (n.children?.length ?? 0) > 0;
}
</script>

<template>
    <div v-for="node in nodes" :key="node.id" class="key-tree-branch">
        <template v-if="isFolder(node)">
            <div
                class="d-flex align-center py-1 cursor-pointer select-none"
                @click="emit('toggle-expand', node.id)"
            >
                <v-icon
                    :icon="expanded[node.id] ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                    size="small"
                    class="me-1"
                />
                <span class="text-medium-emphasis">{{ node.name }}</span>
            </div>
            <div v-show="expanded[node.id]" class="ps-5 border-s-sm border-opacity-25">
                <KeyTreeBranch
                    :nodes="node.children ?? []"
                    :expanded="expanded"
                    :selected-keys="selectedKeys"
                    @toggle-expand="emit('toggle-expand', $event)"
                    @toggle-select="emit('toggle-select', $event)"
                    @edit="emit('edit', $event)"
                    @remove="emit('remove', $event)"
                    @touch="emit('touch', $event)"
                />
            </div>
        </template>
        <div v-else-if="node.original" class="d-flex align-center py-1 ga-1 flex-wrap">
            <v-checkbox
                density="compact"
                hide-details
                class="shrink-0"
                :model-value="selectedKeys.includes(node.original.key)"
                @update:model-value="emit('toggle-select', node.original.key)"
                @click.stop
            />
            <v-tooltip location="bottom" max-width="480">
                <template #activator="{ props: tipProps }">
                    <span
                        v-bind="tipProps"
                        class="text-body-2 text-truncate"
                        style="max-width: min(48vw, 360px)"
                        >{{ node.name }}</span
                    >
                </template>
                {{ node.original.tooltip }}
            </v-tooltip>
            <v-spacer />
            <v-btn
                icon="mdi-pencil"
                size="x-small"
                variant="text"
                :title="$t('keyManager.actions.edit')"
                @click.stop="emit('edit', node.original)"
            />
            <v-btn
                icon="mdi-delete"
                size="x-small"
                variant="text"
                color="error"
                :title="$t('keyManager.actions.remove')"
                @click.stop="emit('remove', node.original)"
            />
            <v-btn
                icon="mdi-hand-back-right"
                size="x-small"
                variant="text"
                :title="$t('keyManager.actions.touch')"
                @click.stop="emit('touch', node.original)"
            />
        </div>
    </div>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}
.select-none {
    user-select: none;
}
.border-s-sm {
    border-left-width: 1px;
    border-left-style: solid;
}
</style>
