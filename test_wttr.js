/*
 * @Descripttion: 
 */
const https = require('https');
https.get('https://api.open-meteo.com/v1/forecast?latitude=22.3667&longitude=114.133&current=temperature_2m,relative_humidity_2m,weather_code', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(parsed.current);
    } catch(e) {
      console.log(data);
    }
  });
});
