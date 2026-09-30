const http = require('http')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    }).on('error', reject)
  })
}

;(async () => {
  const body = await get('http://127.0.0.1:8080/2.js')
  // Find realTimeMonitoring module eval content issues
  const marker = './src/components/visionAI/monitoringWarning/realTimeMonitoring.vue'
  const idx = body.indexOf(marker)
  console.log('marker idx', idx)
  // Extract the module factory around DetectionOverlay require
  const helperIdx = body.indexOf('shaftDetectionHelpers')
  console.log('helpers idx', helperIdx)
  console.log(body.slice(helperIdx - 200, helperIdx + 400))

  // Look for thrown errors in module source strings
  const errIdx = body.indexOf('Module not found')
  console.log('module not found', errIdx)
  if (errIdx >= 0) console.log(body.slice(errIdx - 100, errIdx + 400))

  // Search for Suspicious unicode replacement chars in source
  const bad = body.indexOf('\uFFFD')
  console.log('replacement char', bad)

  // Try to execute just the vue module's dependencies by simulating webpack require for helpers
  const helpersPath = path.join(__dirname, '../src/components/visionAI/monitoringWarning/utils/shaftDetectionHelpers.js')
  console.log('helpers exists', fs.existsSync(helpersPath))

  // Check DetectionOverlay module in chunk
  const ov = body.indexOf('DetectionOverlay.vue')
  console.log('overlay idx', ov)
  // Look near formatDetectionLabel usage for issues
  const fl = body.indexOf('formatDetectionLabel')
  console.log('formatDetectionLabel sample', body.slice(fl, fl + 300))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
