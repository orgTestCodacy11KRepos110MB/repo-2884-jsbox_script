const filenameUtil = require('scripts/filenameUtil')

String.prototype.strictTrim = function() {
    let trimed = this.trim()
    if ((matcher = trimed.match(/([\s\S]+),$/)) !== null) {
        return matcher[1]
    }
    return trimed
}

function promiseConf(url) {
    return new Promise((resolve, reject) => {
        $http.get({
            url: url,
            handler: function (resp) {
                let data = resp.data
                let filename = url
                try {
                    let matcher = resp.response.runtimeValue().invoke('allHeaderFields').rawValue()["Content-Disposition"].match(/filename=(.*?).conf/)
                    filename = matcher[1]
                } catch (e) {
                    filename = filenameUtil.getConfName(url)
                }
                let servers = data.match(/\[Proxy\]([\s\S]*?)\[Proxy Group\]/)
                if (servers != null) {
                    resolve({
                        servers: servers[1],
                        filename: filename
                    })
                } else {
                    reject()
                }
            }
        })
    })
}

function getServersFromConfFile(params) {
    let promiseArray = params.urls.map(i => promiseConf(i))
    Promise.all(promiseArray).then(confs => {
        confs.forEach((res, idx) => {
            console.log(res.servers)
            let servers = res.servers.split(/[\n\r]+/).filter(item => item !== '').map(i => i.strictTrim())
            params.handler({ servers: servers, filename: res.filename, url: params.urls[idx] })
        })
    }).catch(reason => {
        params.handler(null)
    })
}

function decodeScheme(params) {
    let urls = params.ssURL
    let result = []
    let tag

    for (let idx in urls) {
        let url = urls[idx]
        let method, password, hostname, port, plugin
        if (!url.includes('#')) {
            let name = '无节点名称'
            url += `#${name}`
        }
        tag = $text.URLDecode(url.match(/#(.*?)$/)[1])
        if (url.includes('?')) {
            // tag = $text.URLDecode(url.match(/#(.*?)$/)[1])
            let mdps = url.match(/ss:\/\/(.*?)@/)[1]
            let padding = 4 - mdps.length % 4
            if (padding < 4) {
                mdps += Array(padding + 1).join('=')
            }
            let userinfo = $text.base64Decode(mdps)
            method = userinfo.split(':')[0]
            password = userinfo.split(':')[1]
            let htpr = url.match(/@(.*?)\?/)[1].replace('\/', '')
            hostname = htpr.split(':')[0]
            port = htpr.split(':')[1]
            let ps = $text.URLDecode(url.match(/\?(.*?)#/)[1])
            let obfsMatcher = ps.match(/obfs=(.*?)(;|$)/)
            let obfsHostMatcher = ps.match(/obfs-host=(.*?)(;|$)/)
            if (obfsMatcher) {
                let obfs = obfsMatcher[1]
                let obfsHost = obfsHostMatcher? obfsHostMatcher[1] : 'cloudfront.net'
                plugin = `obfs=${obfs}, obfs-host=${obfsHost}`
            }
        } else {
            let mdps = url.match(/ss:\/\/(.*?)#/)[1]
            let padding = 4 - mdps.length % 4
            if (padding < 4) {
                mdps += Array(padding + 1).join('=')
            }
            [method, password, hostname, port] = $text.base64Decode(mdps).split(/[:,@]/)
        }
        let proxy = `${tag} = custom, ${hostname}, ${port}, ${method}, ${password}, http://omgib13x8.bkt.clouddn.com/SSEncrypt.module`
        if (plugin != undefined) {
            proxy += `, ${plugin}`
        }
        result[idx] = proxy
    }

    params.handler({ servers: result, sstag: result.length > 1? `批量ss节点（${result.length}）`: tag })
}

module.exports = {
    proxyFromConf: getServersFromConfFile,
    proxyFromURL: decodeScheme
}