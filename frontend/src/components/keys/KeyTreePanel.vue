<script setup lang="ts">
import { ref, watch } from 'vue';
import type { KeyTreeNode } from '@/lib/buildKeyTree';
import KeyTreeBranch from './KeyTreeBranch.vue';

const props = defineProps<{
    nodes: KeyTreeNode[];
    modelValue: string[];
}>();

const emit = defineEmits<{
    'update:modelValue': [keys: string[]];
    edit: [row: { key: string; value: string; tooltip: string }];
    remove: [row: { key: string; value: string; tooltip: string }];
    touch: [row: { key: string; value: string; tooltip: string }];
}>();

const expanded = ref<Record<number, boolean>>({});

function collectFolderIds(nodes: KeyTreeNode[]): number[] {
    const out: number[] = [];
    for (const n of nodes) {
        if (n.children?.length) {
            out.push(n.id, ...collectFolderIds(n.children));
        }
    }
    return out;
}

function setExpandedAll(open: boolean) {
    if (!open) {
        expanded.value = {};
        return;
    }
    const next: Record<number, boolean> = {};
    for (const id of collectFolderIds(props.nodes)) {
        next[id] = true;
    }
    expanded.value = next;
}

defineExpose({ setExpandedAll });

watch(
    () => props.nodes,
    () => {
        expanded.value = {};
    },
);

function toggleSelect(key: string) {
    const cur = [...props.modelValue];
    const i = cur.indexOf(key);
    if (i === -1) {
        emit('update:modelValue', [...cur, key]);
    } else {
        cur.splice(i, 1);
        emit('update:modelValue', cur);
    }
}

function toggleExpand(id: number) {
    expanded.value = {
        ...expanded.value,
        [id]: !expanded.value[id],
    };
}
</script>

<template>
    <div class="key-tree-panel pa-2">
        <KeyTreeBranch
            :nodes="nodes"
            :expanded="expanded"
            :selected-keys="modelValue"
            @toggle-expand="toggleExpand"
            @toggle-select="toggleSelect"
            @edit="emit('edit', $event)"
            @remove="emit('remove', $event)"
            @touch="emit('touch', $event)"
        />
    </div>
</template>
