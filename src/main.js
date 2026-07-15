import Vue from 'vue';
import App from './App.vue';
import ElementUI, {Notification} from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import './styles/design-system.css';
import router from './router/index.js';
import axios from 'axios';
import VueCookies from 'vue-cookies';
import VCharts from 'v-charts';
import logViewer from '@femessage/log-viewer';
import dataV from '@jiaminghi/data-view'

import VueClipboard from 'vue-clipboard2';
import Fingerprint2 from 'fingerprintjs2';
import VueClipboards from 'vue-clipboards';
import Contextmenu from "vue-contextmenujs"
Vue.config.productionTip = false;


// 生成唯一ID
Fingerprint2.get(function (components) {
  const values = components.map(function (component, index) {
    if (index === 0) { //把微信浏览器里UA的wifi或4G等网络替换成空,不然切换网络会ID不一样
      return component.value.replace(/\bNetType\/\w+\b/, '');
    }
    return component.value;
  })
  //console.log(values)  //使用的浏览器信息npm
  // 生成最终id
  let port = window.location.port;
  const fingerPrint = Fingerprint2.x64hash128(values.join(port), 31)
  Vue.prototype.$browserId = fingerPrint;
  console.log("浏览器 ID: " + fingerPrint);
});

Vue.use(VueClipboard);
Vue.use(ElementUI);
Vue.use(VueCookies);
Vue.use(VueClipboards);

Vue.prototype.$notify = Notification;
Vue.use(Contextmenu);
Vue.use(VCharts);
Vue.use(logViewer);
Vue.use(dataV);

// 全局 axios（部分遗留组件兼容）
const config = require('../config/index.js');
axios.defaults.baseURL = config.API_BASE_URL + '/api/v1';
axios.defaults.withCredentials = false;
axios.interceptors.response.use((response) => response, (error) => {
  console.log('API请求错误:', error);
  return Promise.reject(error);
});

Vue.prototype.$axios = axios;
Vue.prototype.$cookies.config(60 * 30);
Vue.prototype.$tableHeght = window.innerHeight - 170;
Vue.prototype.$channelTypeList = {
  1: {id: 1, name: "国标设备", style: {color: "#409eff", borderColor: "#b3d8ff"}},
  2: {id: 2, name: "推流设备", style: {color: "#67c23a", borderColor: "#c2e7b0"}},
  3: {id: 3, name: "拉流代理", style: {color: "#e6a23c", borderColor: "#f5dab1"}},
};





new Vue({
  router: router,
  render: h => h(App),
}).$mount('#app')
