import { set as _set, get as _get } from 'lodash-es';
// @ts-expect-error — list-to-tree is CJS-only and ships without typings
import ListToTree from 'list-to-tree';

export type KeyRow = { key: string; value: string; tooltip: string };

export type KeyTreeNode = {
    id: number;
    name: string;
    parent: number;
    children?: KeyTreeNode[];
    original?: { key: string; value: string; tooltip: string };
};

function shortenText(text: string, shallShorten: boolean): string {
    if (shallShorten && text.length > 50) {
        return text.slice(0, 50).concat('...');
    }
    return text;
}

/** Mirrors legacy `key-manager.vue` `loadTree()` (list-to-tree + lodash path map). */
export function buildKeyTreeFromRows(rows: KeyRow[], separator: string): KeyTreeNode[] {
    if (!separator) {
        return [];
    }
    const tmp: KeyTreeNode[] = [];
    const keyMap: Record<string, unknown> = {};
    let counter = 1;

    for (const item of rows) {
        const keys = item.key.split(separator);

        for (let i = 0; i < keys.length; i += 1) {
            const object: KeyTreeNode = {
                id: (counter += 1),
                name: keys[i],
                parent: 0,
                original: {
                    key: item.key,
                    value: shortenText(item.value, i === keys.length - 1),
                    tooltip: keys[i],
                },
            };

            _set(keyMap, keys.slice(0, i + 1), {
                nodeId: object.id,
                ...(_get(keyMap, keys.slice(0, i + 1)) as Record<string, unknown>),
            });

            const parentId = _get(keyMap, keys.slice(0, i)) as { nodeId?: number } | undefined;
            object.parent = 0;
            if (parentId?.nodeId) {
                object.parent = parentId.nodeId;
            }

            if (
                !tmp.find(
                    (node) => node.name === object.name && node.parent === object.parent,
                )
            ) {
                tmp.push(object);
            }
        }

        const leaf: KeyTreeNode = {
            id: (counter += 1),
            name: shortenText(item.value, true),
            parent: tmp[tmp.length - 1]!.id,
            original: {
                key: item.key,
                value: shortenText(item.value, true),
                tooltip: item.tooltip,
            },
        };
        tmp.push(leaf);
    }

    const tree = new ListToTree(tmp, {
        key_id: 'id',
        key_parent: 'parent',
        key_child: 'children',
        empty_children: false,
    });
    return tree.GetTree() as KeyTreeNode[];
}
