import * as WailsApp from '../../wailsjs/go/main/App';

export function readConfigJSON(): string {
    return localStorage.getItem('config') ?? '{}';
}

export async function etcdPing(): Promise<Record<string, unknown>> {
    const raw = await WailsApp.EtcdPing(readConfigJSON());
    return JSON.parse(raw) as Record<string, unknown>;
}

export async function etcdMemberList(): Promise<Record<string, unknown>> {
    const raw = await WailsApp.EtcdMemberList(readConfigJSON());
    return JSON.parse(raw) as Record<string, unknown>;
}

export async function etcdListKeys(prefix: string): Promise<{ items: { key: string; value: string }[] }> {
    const raw = await WailsApp.EtcdListKeys(readConfigJSON(), prefix);
    return JSON.parse(raw) as { items: { key: string; value: string }[] };
}

export async function etcdGetKey(key: string): Promise<string> {
    return WailsApp.EtcdGetKey(readConfigJSON(), key);
}

export async function etcdPutKey(key: string, value: string, leaseSeconds: number): Promise<void> {
    await WailsApp.EtcdPutKey(readConfigJSON(), key, value, leaseSeconds);
}

export async function etcdDeleteKeys(keys: string[]): Promise<void> {
    await WailsApp.EtcdDeleteKeys(readConfigJSON(), JSON.stringify(keys));
}

export async function etcdTouchKeys(keys: string[]): Promise<{ touched: number }> {
    const raw = await WailsApp.EtcdTouchKeys(readConfigJSON(), JSON.stringify(keys));
    return JSON.parse(raw) as { touched: number };
}

export async function etcdPurgeAllKeys(): Promise<{ deleted: number }> {
    const raw = await WailsApp.EtcdPurgeAllKeys(readConfigJSON());
    return JSON.parse(raw) as { deleted: number };
}

export async function etcdPutKeyTx(
    key: string,
    value: string,
    leaseSeconds: number,
    createOnly: boolean,
): Promise<{ succeeded: boolean; revision?: number }> {
    const raw = await WailsApp.EtcdPutKeyTx(
        readConfigJSON(),
        key,
        value,
        leaseSeconds,
        createOnly,
    );
    return JSON.parse(raw) as { succeeded: boolean; revision?: number };
}

export async function etcdStartKVWatch(): Promise<void> {
    await WailsApp.EtcdStartKVWatch(readConfigJSON());
}

export async function etcdStopKVWatch(): Promise<void> {
    await WailsApp.EtcdStopKVWatch();
}

export async function etcdStartKeyRevisionWatch(key: string): Promise<void> {
    await WailsApp.EtcdStartKeyRevisionWatch(readConfigJSON(), key);
}

export async function etcdStopKeyRevisionWatch(): Promise<void> {
    await WailsApp.EtcdStopKeyRevisionWatch();
}

export async function etcdMenuCapabilities(): Promise<{
    isRoot: boolean;
    serverVersion: number;
    version?: string;
    statusError?: string;
}> {
    const raw = await WailsApp.EtcdMenuCapabilities(readConfigJSON());
    return JSON.parse(raw) as {
        isRoot: boolean;
        serverVersion: number;
        version?: string;
        statusError?: string;
    };
}

export async function etcdMaintenanceStatus(): Promise<Record<string, unknown>> {
    const raw = await WailsApp.EtcdMaintenanceStatus(readConfigJSON());
    return JSON.parse(raw) as Record<string, unknown>;
}

export async function etcdMaintenanceAlarmsForMember(memberID: string): Promise<{ alarms: unknown[] }> {
    const raw = await WailsApp.EtcdMaintenanceAlarmsForMember(readConfigJSON(), memberID);
    return JSON.parse(raw) as { alarms: unknown[] };
}

export async function etcdAuthUserList(): Promise<string[]> {
    const raw = await WailsApp.EtcdAuthUserList(readConfigJSON());
    return (JSON.parse(raw) as { users: string[] }).users ?? [];
}

export async function etcdAuthRoleList(): Promise<string[]> {
    const raw = await WailsApp.EtcdAuthRoleList(readConfigJSON());
    return (JSON.parse(raw) as { roles: string[] }).roles ?? [];
}

export async function etcdAuthUserDelete(name: string): Promise<void> {
    await WailsApp.EtcdAuthUserDelete(readConfigJSON(), name);
}

export async function etcdAuthRoleDelete(name: string): Promise<void> {
    await WailsApp.EtcdAuthRoleDelete(readConfigJSON(), name);
}

export async function etcdAuthUserAdd(name: string, password: string): Promise<void> {
    await WailsApp.EtcdAuthUserAdd(readConfigJSON(), name, password);
}

export async function etcdAuthRoleAdd(name: string): Promise<void> {
    await WailsApp.EtcdAuthRoleAdd(readConfigJSON(), name);
}

export async function etcdAuthUserGet(name: string): Promise<string[]> {
    const raw = await WailsApp.EtcdAuthUserGet(readConfigJSON(), name);
    return (JSON.parse(raw) as { roles: string[] }).roles ?? [];
}

export async function etcdAuthUserGrantRole(user: string, role: string): Promise<void> {
    await WailsApp.EtcdAuthUserGrantRole(readConfigJSON(), user, role);
}

export async function etcdAuthUserRevokeRole(user: string, role: string): Promise<void> {
    await WailsApp.EtcdAuthUserRevokeRole(readConfigJSON(), user, role);
}

export async function etcdAuthUserChangePassword(user: string, password: string): Promise<void> {
    await WailsApp.EtcdAuthUserChangePassword(readConfigJSON(), user, password);
}

export type RolePermRow = {
    keyB64: string;
    rangeEndB64: string;
    perm: string;
    mode: string;
    keyDisplay: string;
    isPrefix: boolean;
};

export async function etcdAuthRoleGet(role: string): Promise<RolePermRow[]> {
    const raw = await WailsApp.EtcdAuthRoleGet(readConfigJSON(), role);
    return (JSON.parse(raw) as { perms: RolePermRow[] }).perms ?? [];
}

export async function etcdAuthRoleGrantPermission(body: {
    role: string;
    mode: string;
    key: string;
    perm: string;
    checkDuplicate?: boolean;
}): Promise<void> {
    await WailsApp.EtcdAuthRoleGrantPermission(readConfigJSON(), JSON.stringify(body));
}

export async function etcdAuthRoleRevokePermission(body: {
    role: string;
    keyB64: string;
    rangeEndB64: string;
}): Promise<void> {
    await WailsApp.EtcdAuthRoleRevokePermission(readConfigJSON(), JSON.stringify(body));
}

export async function etcdLeaseList(): Promise<{ id: string; ttl: number }[]> {
    const raw = await WailsApp.EtcdLeaseList(readConfigJSON());
    return (JSON.parse(raw) as { items: { id: string; ttl: number }[] }).items ?? [];
}

export async function etcdLeaseRevoke(id: string): Promise<void> {
    await WailsApp.EtcdLeaseRevoke(readConfigJSON(), id);
}

export type LeaseDetail = {
    id: string;
    ttl: number;
    grantedTTL: number;
    keys: string[];
};

export async function etcdLeaseGet(id: string): Promise<LeaseDetail> {
    const raw = await WailsApp.EtcdLeaseGet(readConfigJSON(), id);
    return JSON.parse(raw) as LeaseDetail;
}

export async function etcdLeasePurgeAll(): Promise<{ revoked: number }> {
    const raw = await WailsApp.EtcdLeasePurgeAll(readConfigJSON());
    return JSON.parse(raw) as { revoked: number };
}

export type UserWatchSpec = {
    name: string;
    key: string;
    prefix: boolean;
    /** Match legacy `store.state.watchers` listener toggles. */
    error: boolean;
    disconnects: boolean;
    reconnects: boolean;
};

export async function etcdStartUserWatch(spec: UserWatchSpec): Promise<void> {
    await WailsApp.EtcdStartUserWatch(readConfigJSON(), JSON.stringify(spec));
}

export async function etcdStopUserWatch(name: string): Promise<void> {
    await WailsApp.EtcdStopUserWatch(name);
}

export async function etcdStopAllUserWatches(): Promise<void> {
    await WailsApp.EtcdStopAllUserWatches();
}
