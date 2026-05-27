const axios = require('axios');
const baseURL = 'http://192.168.26.193:8000/api/v1/wvp';

async function test() {
  try {
    let res = await axios.get(baseURL + '/api/push/start', { params: { id: 264 } });
    console.log('GET id=264:', res.data.code, res.data.msg);
  } catch(e) { console.log('GET id=264 error:', e.response?.data?.msg || e.message); }

  try {
    let res = await axios.get(baseURL + '/api/push/start', { params: { pushId: 264 } });
    console.log('GET pushId=264:', res.data.code, res.data.msg);
  } catch(e) { console.log('GET pushId=264 error:', e.response?.data?.msg || e.message); }

  try {
    let res = await axios.get(baseURL + '/api/push/start', { params: { app: 'detection', stream: 'video_90b31527' } });
    console.log('GET app,stream:', res.data.code, res.data.msg);
  } catch(e) { console.log('GET app,stream error:', e.response?.data?.msg || e.message); }
}
test();