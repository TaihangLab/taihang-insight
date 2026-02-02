'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')
const config = require('./index')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  BASE_API: `"${config.API_BASE_URL}"`
})
