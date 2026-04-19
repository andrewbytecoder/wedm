import type { GenericObject } from '@/types';
import {
    etcdMaintenanceAlarmsForMember,
    etcdMaintenanceStatus,
    etcdMemberList,
} from '@/services/etcdBridge';

export interface ClusterMember {
    ID: string;
    name: string;
    clientURLs: string[];
    peerURLs: string[];
}

export interface MemberListPayload {
    members: ClusterMember[];
    header: GenericObject;
}

export async function listClusterMembers(): Promise<MemberListPayload> {
    const data = (await etcdMemberList()) as unknown as MemberListPayload;
    return data;
}

export async function fetchClusterMaintenanceStatus(): Promise<{
    dbSize: number;
    leader: string;
    raftIndex: number;
    raftTerm: number;
    version: string;
}> {
    const raw = await etcdMaintenanceStatus();
    return raw as {
        dbSize: number;
        leader: string;
        raftIndex: number;
        raftTerm: number;
        version: string;
    };
}

export async function fetchAlarmsForMember(memberID: string): Promise<{ alarms: unknown[] }> {
    return etcdMaintenanceAlarmsForMember(memberID) as Promise<{ alarms: unknown[] }>;
}
