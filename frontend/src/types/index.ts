/** Shared types (ported from repo `types/`; etcd-specific types use `unknown` until Go client is bound). */

export interface GenericObject {
    [key: string]: unknown;
}

export type EtcdPermissionType = 'Read' | 'Write' | 'Readwrite';

export interface CurrentProfileType {
    name: string;
    host: string;
    port: number;
}

export interface PermissionObject {
    key: string;
    prefix: boolean;
    isAll: boolean;
    permission: EtcdPermissionType;
}

export interface EtcdItem extends GenericObject {
    key: string;
    value: unknown;
}

export interface TreeNodeType {
    id?: string | number;
    isLeaf?: boolean;
    parent?: string | number;
    name?: string;
    children?: TreeNodeType[];
    original?: GenericObject;
}
