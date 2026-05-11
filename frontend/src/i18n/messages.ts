export const messages = {
    en: {
        menu: {
            settings: 'Settings',
            manageCluster: 'Manage cluster',
            manageKeys: 'Manage keys',
            manageWatchers: 'Manage watchers',
            manageUsers: 'Manage users',
            manageRoles: 'Manage roles',
            manageLeases: 'Manage leases',
            about: 'About',
        },
        migration: {
            title: 'Screen not yet ported',
            body: 'This route is wired in Vue 3 + Wails. Port the legacy component from src/components into frontend/src/views.',
        },
        guard: {
            incompleteConfig:
                'Your ETCD config is incomplete, please update it in Settings.',
        },
        shell: {
            profile: 'Profile',
            toggleMenu: 'Toggle menu',
        },
    },
    zh: {
        menu: {
            settings: '设置',
            manageCluster: '管理集群',
            manageKeys: '管理键值',
            manageWatchers: '管理观察者',
            manageUsers: '管理用户',
            manageRoles: '管理角色',
            manageLeases: '管理租约',
            about: '关于',
        },
        migration: {
            title: '页面尚未移植',
            body: '此路由已在 Vue 3 + Wails 中配置。请将旧组件从 src/components 移植到 frontend/src/views。',
        },
        guard: {
            incompleteConfig:
                '您的 ETCD 配置不完整，请在设置中更新。',
        },
        shell: {
            profile: '配置文件',
            toggleMenu: '切换菜单',
        },
    },
};
