const http = require('http')

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }))
    }).on('error', reject)
  })
}

;(async () => {
  const app = await get('http://127.0.0.1:8080/app.js')
  console.log('app.js status', app.status, 'len', app.body.length)
  const idx = app.body.indexOf('realTimeMonitoring')
  console.log('realTimeMonitoring idx', idx)
  // webpack async require patterns like __webpack_require__.e(n)
  const nearby = idx >= 0 ? app.body.slice(Math.max(0, idx - 200), idx + 200) : ''
  console.log('nearby', nearby)

  // find chunk map entries mentioning monitoringWarning
  const re = /monitoringWarning\/realTimeMonitoring[^"']*/g
  let m
  while ((m = re.exec(app.body))) {
    console.log('match', m[0])
  }

  // Try common chunk ids by probing until we find compile error
  // Look for jsonp chunk mapping
  const mapMatch = app.body.match(/scriptSrc\s*=\s*function[^}]+}/)
  if (mapMatch) console.log('scriptSrc fn snippet', mapMatch[0].slice(0, 300))

  // Extract chunk filename function
  const chunkRe = /\{(?:\d+:"[^"]+",?)+\}/g
  let found = 0
  let cm
  while ((cm = chunkRe.exec(app.body)) && found < 3) {
    if (cm[0].includes('.js')) {
      console.log('chunkmap sample', cm[0].slice(0, 400))
      found++
    }
  }

  // Request possible chunks that appear near realtime by scanning for .e(
  const eRe = /\.e\((\d+)\)/g
  const ids = new Set()
  let em
  const window = app.body.slice(Math.max(0, idx - 500), idx + 500)
  while ((em = eRe.exec(window))) ids.add(em[1])
  console.log('nearby chunk ids', [...ids])

  for (const id of ids) {
    const url = `http://127.0.0.1:8080/${id}.js`
    try {
      const r = await get(url)
      console.log('chunk', id, 'status', r.status, 'len', r.body.length, 'head', r.body.slice(0, 120).replace(/\n/g, ' '))
      if (r.body.includes('Error') || r.body.includes('Module build failed') || r.body.includes('SyntaxError')) {
        console.log('ERROR BODY', r.body.slice(0, 2000))
      }
      if (r.body.includes('SHAFT_DEV_MOCK') || r.body.includes('shaftDetectionHelpers') || r.body.includes('normalizeDashboard')) {
        console.log('chunk', id, 'looks like realtime-related')
      }
    } catch (e) {
      console.log('chunk fail', id, e.message)
    }
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
