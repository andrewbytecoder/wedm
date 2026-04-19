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
    hu: {
        menu: {
            settings: 'Beállítások',
            manageCluster: 'Fürt kezelése',
            manageKeys: 'Kulcsok kezelése',
            manageWatchers: 'Figyelők kezelése',
            manageUsers: 'Felhasználók kezelése',
            manageRoles: 'Szerepkörök kezelése',
            manageLeases: 'Bérletek kezelése',
            about: 'Névjegy',
        },
        migration: {
            title: 'Képernyő még nincs átültetve',
            body: 'Az útvonal Vue 3 + Wails alatt fut. A régi komponens a src/components mappából másolandó a frontend/src/views alá.',
        },
        guard: {
            incompleteConfig:
                'Az ETCD beállítás hiányos, kérjük frissítse a Beállításokban.',
        },
        shell: {
            profile: 'Profil',
            toggleMenu: 'Menü',
        },
    },
};
