import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import { i18n } from './i18n';
import { useSettingsStore } from './stores/settings';
import './assets/styles.css';

const app = createApp(App);
const pinia = createPinia();

//  使用pinia进行存储
app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(i18n);

const settings = useSettingsStore();
// 从本地存储中恢复设置
settings.hydrateFromLocalStorage();
//  根据设置的语言设置语言
i18n.global.locale.value = settings.config.language === 'zh' ? 'zh' : 'en';
document.querySelector('html')?.setAttribute('lang', settings.config.language);

app.mount('#app');
