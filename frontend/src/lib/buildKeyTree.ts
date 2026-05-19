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

/** Build a nested tree from flat key rows using a separator. */
export function buildKeyTreeFromRows(rows: KeyRow[], separator: string): KeyTreeNode[] {
    if (!separator) {
        return [];
    }
    const tmp: KeyTreeNode[] = [];
    const pathMap = new Map<string, number>(); // path -> nodeId
    let counter = 1;

    for (const item of rows) {
        // 过滤空字符串段，防止 key/ 末尾分隔符或连续分隔符产生空节点
        const keys = item.key.split(separator).filter((s) => s !== '');
        if (keys.length === 0) continue;

        for (let i = 0; i < keys.length; i += 1) {
            const isLast = i === keys.length - 1;
            const path = keys.slice(0, i + 1).join(separator);

            // 已存在该路径则复用
            if (pathMap.has(path)) {
                continue;
            }

            const parentPath = keys.slice(0, i).join(separator);
            const parentId = parentPath ? (pathMap.get(parentPath) ?? 0) : 0;

            const object: KeyTreeNode = {
                id: (counter += 1),
                name: keys[i],
                parent: parentId,
                original: {
                    key: item.key,
                    value: shortenText(item.value, isLast),
                    tooltip: isLast ? item.tooltip : keys[i],
                },
            };

            pathMap.set(path, object.id);
            tmp.push(object);
        }

        // leaf: 不需要额外创建节点，最后一个段本身就是 leaf
        // 但为了兼容现有 UI（leaf 显示值），我们把最后一个段当作 leaf
        // 如果该路径同时是其他 key 的前缀，它会在后续被当作 folder
    }

    // Build nested tree manually
    const nodeMap = new Map<number, KeyTreeNode>();
    for (const node of tmp) {
        nodeMap.set(node.id, { ...node });
    }

    const roots: KeyTreeNode[] = [];
    for (const node of nodeMap.values()) {
        if (node.parent === 0) {
            roots.push(node);
        } else {
            const parent = nodeMap.get(node.parent);
            if (parent) {
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(node);
            } else {
                roots.push(node);
            }
        }
    }

    return roots;
}
