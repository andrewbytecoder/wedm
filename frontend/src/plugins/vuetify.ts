import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';

//  引入图标， 具体图标进入到css里面直接搜索即可
//  import '@mdi/font/css/materialdesignicons.css';

export default createVuetify({
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                //  自定义颜色
                colors: {
                    // 覆盖默认的 success 颜色
                    success: '#00E676',
                    // 覆盖默认的 primary 颜色
                    primary: '#1976D2',
                    // 你可以定义任意名字的颜色，然后在组件里用 color="myColor"
                    brand: '#FF5722',
                },
            },
            light: {
                colors: {
                    success: '#4CAF50',
                    primary: '#2196F3',
                    brand: '#FF5722',
                },
            },
        },
    },
});
