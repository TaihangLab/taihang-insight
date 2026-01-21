import merge from 'webpack-merge';
import prodEnv from './prod.env';

'use strict'
module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  VUE_APP_MOCK_ENABLED: '"true"'
})
