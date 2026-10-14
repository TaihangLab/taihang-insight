'use strict'

// webpack-dev-server 2 无条件 require('spdy')，spdy 又加载 http-deceiver。
// 后者在加载时读取已从 Node 12 之后移除、Node 21+ 会直接抛错的
// process.binding('http_parser')。本项目 devServer 不启用 https，
// 这段只为让模块能完成初始化。

var methods = [
  'DELETE', 'GET', 'HEAD', 'POST', 'PUT', 'CONNECT', 'OPTIONS', 'TRACE',
  'COPY', 'LOCK', 'MKCOL', 'MOVE', 'PROPFIND', 'PROPPATCH', 'SEARCH',
  'UNLOCK', 'BIND', 'REBIND', 'UNBIND', 'ACL', 'REPORT', 'MKACTIVITY',
  'CHECKOUT', 'MERGE', 'M-SEARCH', 'NOTIFY', 'SUBSCRIBE', 'UNSUBSCRIBE',
  'PATCH', 'PURGE', 'MKCALENDAR', 'LINK', 'UNLINK'
]

var HTTPParser = {
  methods: methods,
  kOnHeaders: 0,
  kOnHeadersComplete: 1,
  kOnMessageComplete: 2,
  kOnBody: 3
}

var binding = process.binding
process.binding = function (name) {
  if (name === 'http_parser') {
    return { HTTPParser: HTTPParser, methods: methods }
  }
  return binding.call(process, name)
}

// Webpack 3 默认用 md4。OpenSSL 3（Node 17+）不再提供该算法。
var crypto = require('crypto')
var createHash = crypto.createHash
crypto.createHash = function (algorithm, options) {
  return createHash.call(crypto, algorithm === 'md4' ? 'sha256' : algorithm, options)
}
