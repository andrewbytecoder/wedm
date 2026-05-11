import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import { i18n } from './i18n';
import { useSettingsStore } from './stores/settings';

const app = createApp(App);
const pinia = createPinia();

//  使用pinia进行存储
app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(i18n);

const settings = useSettingsStore();
settings.hydrateFromLocalStorage();
i18n.global.locale.value = settings.config.language === 'zh' ? 'zh' : 'en';
document.querySelector('html')?.setAttribute('lang', settings.config.language);

app.mount('#app');
