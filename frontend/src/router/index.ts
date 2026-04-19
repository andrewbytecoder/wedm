import { createRouter, createWebHashHistory } from 'vue-router';
import { isConfiguredGuard } from './guards';

const AboutPage = () => import('@/views/AboutPage.vue');
const ClusterHealthPage = () => import('@/views/ClusterHealthPage.vue');
const ConfigurationPage = () => import('@/views/ConfigurationPage.vue');
const KeyManagerPage = () => import('@/views/KeyManagerPage.vue');
const UserManagerPage = () => import('@/views/UserManagerPage.vue');
const RoleManagerPage = () => import('@/views/RoleManagerPage.vue');
const LeaseManagerPage = () => import('@/views/LeaseManagerPage.vue');
const WatcherManagerPage = () => import('@/views/WatcherManagerPage.vue');

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', redirect: '/configure' },
        {
            path: '/configure',
            name: 'config',
            component: ConfigurationPage,
        },
        {
            path: '/keys',
            name: 'keys',
            component: KeyManagerPage,
            beforeEnter: (_to, from) => isConfiguredGuard(from),
        },
        {
            path: '/users',
            name: 'users',
            component: UserManagerPage,
            beforeEnter: (_to, from) => isConfiguredGuard(from),
        },
        {
            path: '/leases',
            name: 'leases',
            component: LeaseManagerPage,
            beforeEnter: (_to, from) => isConfiguredGuard(from),
        },
        {
            path: '/cluster',
            name: 'cluster',
            component: ClusterHealthPage,
            beforeEnter: (_to, from) => isConfiguredGuard(from),
        },
        {
            path: '/watchers',
            name: 'watchers',
            component: WatcherManagerPage,
            beforeEnter: (_to, from) => isConfiguredGuard(from),
        },
        {
            path: '/roles',
            name: 'roles',
            component: RoleManagerPage,
            beforeEnter: (_to, from) => isConfiguredGuard(from),
        },
        {
            path: '/about',
            name: 'about',
            component: AboutPage,
        },
    ],
});

export default router;
