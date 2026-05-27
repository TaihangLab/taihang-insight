const axios = require('axios');
axios.defaults.baseURL = 'http://192.168.1.1:8000/api/v1/wvp';

axios.get('/api/v1/wvp/api/push/start').catch(e => console.log(e.config.url, e.request?._currentUrl));
axios.get('api/v1/wvp/api/push/start').catch(e => console.log(e.config.url, e.request?._currentUrl));
axios.get('/api/v1/region/list').catch(e => console.log(e.config.url, e.request?._currentUrl));
