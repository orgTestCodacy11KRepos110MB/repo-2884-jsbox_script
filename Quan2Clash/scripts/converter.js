function convert(iniObj) {
  let filters = iniObj.filters
  let servers = iniObj.servers
  let policies = iniObj.policies

  let clashFilters = filterModify(filters)
  let clashServers = serverModify(servers).filter(s => s)

  let serverNames = clashServers.map(server => server.name)
  let policyNames = policies.map(policy => {
    if (/(.*?):/.test(policy)) {
      return RegExp.$1.trim()
    }
  })
  let clashPolicies = policyModify(policies, serverNames.concat(policyNames))
  clashPolicies.unshift({
    type: 'select',
    name: 'PROXY',
    proxies: serverNames
  })
  // console.log(clashServers)

  return {
    "Proxy": clashServers,
    "Proxy Group": clashPolicies.sort((a, b) => {
      if (a.proxies.indexOf(b.name) > -1) {
        return 1
      } else if (b.proxies.indexOf(a.name) > -1) {
        return -1
      } 
      return 0
    }),
    "Rule": clashFilters
  }
}

function serverModify(servers) {
  return servers.map(server => {
    if (/(.*?)=\s*shadowsocks\s*,(.*)/.test(server)) {
      return clashShadowsocks(RegExp.$1, RegExp.$2)
    } else if (/(.*?)=\s*vmess\s*,(.*)/.test(server)) {
      return clashVmess(RegExp.$1, RegExp.$2)
    }
    return null
  })
}

function clashShadowsocks(name, paramsStr) {
  try {
    let params = paramsStr.split(/,/).map(i => i.trim())
    let ssObj = {
      name: name.trim(),
      type: 'ss',
      server: params[0],
      port: params[1],
      cipher: params[2],
      password: params[3].replace(/"/g, '')
    }
    let obfsType = paramByKey('obfs', params)
    if (obfsType) {
      ssObj['plugin'] = 'obfs'
      ssObj['plugin-opts'] = {
        "mode": obfsType,
        "host": paramByKey("obfs-host", params) || 'bing.com'
      }
    }
    return ssObj
  } catch (e) {
    console.error(`Shadowsocks "${name}" could not be converted!`)
    return null
  }
}

function clashVmess(name, paramsStr) {
  try {
    let params = paramsStr.split(/,/).map(i => i.trim())
    let cipher = params[2]
    if (cipher === 'chacha20-ietf-poly1305') {
      cipher = 'chacha20-poly1305'
    } else if (cipher === 'aes-128-cfb') {
      cipher = 'auto'
    }
    let vmessObj = {
      name: name.trim(),
      type: 'vmess',
      server: params[0],
      port: params[1],
      cipher: cipher,
      uuid: params[3].replace(/"/g, ''),
      alterId: 32
    }
    let overTls = paramByKey("over-tls", params)
    if (overTls === true) {
      vmessObj['tls'] = true
    }
    let skipCert = paramByKey("certificate", params)
    if (skipCert) {
      vmessObj['skip-cert-verify'] = skipCert === 0
    }
    let obfs = paramByKey('obfs', params)
    if (obfs === 'ws') {
      vmessObj['network'] = 'ws'
      vmessObj['ws-path'] = paramByKey('obfs-path', params) || '/path'
      let headersStr = paramByKey('obfs-header', params)
      // console.log('headersStr:', headersStr)
      if (headersStr) {
        try {
          vmessObj['ws-headers'] = convertHeaders(headersStr)
        } catch (e) {
          vmessObj['ws-headers'] = { "Host": "v2ray.com" }
        }
      }
    }
    return vmessObj
  } catch (e) {
    console.error(e.stack)
    console.error(`Shadowsocks "${name}" could not be converted!`)
    return null
  }
}

function convertHeaders(str) {
  let ps = str.replace(/(^"|"$)/, '').split('[Rr][Nn]')
  let obj = {}
  ps.forEach(p => {
    if (/(.*?):(.+)/.test(p)) {
      obj[RegExp.$1.trim()] = RegExp.$2.trim()
    }
  })
  return obj
}

function paramByKey(key, params) {
  let param = params.find(p => {
    let sp = p.split('=')
    if (sp.length === 2 && sp[0].trim() === key.trim()) {
      return true
    }
    return false
  })
  if (param) {
    return param.split("=")[1]
  }
  return null
}

function policyModify(policies, serverNames) {
  return policies.map(policy => {
    if (/(.*?):\s*auto\s*\n([\s\S]+)/.test(policy)) {
      return {
        name: RegExp.$1.trim(),
        type: "url-test",
        proxies: RegExp.$2.split(/\n/).filter(i => i !== '' && serverNames.indexOf(i) > -1),
        url: "http://www.gstatic.com/generate_204",
        interval: 300
      }
    } else if (/(.*?):\s*static\s*,\s*(.*?)\s*\n([\s\S]+)/.test(policy)) {
      return {
        name: RegExp.$1.trim(),
        type: 'select',
        proxies: [RegExp.$2, ...RegExp.$3.split('\n').filter(i => i !== '' && i !== RegExp.$2 && serverNames.indexOf(i) > -1)]
      }
    } else if (/(.*?):\s*balance\s*,\s*round-robin\s*\n([\s\S]+)/.test(policy)) {
      return {
        name: RegExp.$1.trim(),
        type: 'load-balance',
        proxies: RegExp.$2.split(/\n/).filter(i => i && serverNames.indexOf(i) > -1),
        url: "http://www.gstatic.com/generate_204",
        interval: 300
      }
    }
    console.error(`"${policy}" could not be converted!`)
    return null
  }).filter(i => i)
}

function filterModify(filters) {
  return filters.map(filter => {
    if (/FINAL,([^,]+)/.test(filter)) {
      return "MATCH," + RegExp.$1
    } else if (/HOST(\-*[^,]*?),([^,]+?),([^,]+)/.test(filter)) {
      return `DOMAIN${RegExp.$1},${RegExp.$2},${RegExp.$3}`
    } else if (/(IP-CIDR|GEOIP)\s*,([^,]+?),([^,]+)/.test(filter)) {
      return `${RegExp.$1},${RegExp.$2},${RegExp.$3}`
    }
    console.error(`"${filter}" could not be converted!`)
  })
}

module.exports = {
  convert
}