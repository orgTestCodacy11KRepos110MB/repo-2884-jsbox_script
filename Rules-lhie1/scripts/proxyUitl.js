const filenameUtil = require('scripts/filenameUtil')

function getServersFromConfFile(params) {
    new Promise((resolve, reject) => {
        $http.get({
            url: params.confURL,
            handler: function (resp) {
                let data = resp.data
                let filename = params.confURL
                try{
                    let matcher = resp.response.runtimeValue().invoke('allHeaderFields').rawValue()["Content-Disposition"].match(/filename=(.*?).conf/)
                    filename = matcher[1]
                }catch{
                    filename = filenameUtil.getConfName(params.confURL)
                }
                console.log(filename)                
                let servers = data.match(/\[Proxy\]\n([\s\S]*?)\n\[Proxy Group\]/)
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
    }).then(res => {
        let servers = res.servers.split(/[\n]+/).filter(item => item != '')
        params.handler({servers: servers, filename: res.filename})
    }).catch(reason => {
        params.handler(null)
    })
}

function decodeScheme(params) {
    let method, password, hostname, port, plugin, tag

    let url = params.ssURL

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
        let obfs = ps.match(/obfs=(.*?);/)[1]
        let obfsHost = ps.match(/obfs-host=(.*?)$/)[1]
        plugin = `obfs=${obfs}, obfs-host=${obfsHost}`
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
    params.handler({servers: [proxy], sstag: tag})
}

module.exports = {
    proxyFromConf: getServersFromConfFile,
    proxyFromURL: decodeScheme
}