const filenameUtil = require('scripts/filenameUtil')

String.prototype.strictTrim = function () {
    let trimed = this.trim()
    if ((matcher = trimed.match(/([\s\S]+),$/)) !== null) {
        return matcher[1]
    }
    return trimed
}

function urlsaveBase64Encode(url) {
    return $text.base64Encode(url).replace(/\-/g, '+').replace(/\\/g, '_').replace(/=+$/, '')
}

function urlsaveBase64Decode(base64) {
    // Add removed at end '='
    base64 += Array(5 - base64.length % 4).join('=');
    base64 = base64
        .replace(/\-/g, '+') // Convert '-' to '+'
        .replace(/\_/g, '/'); // Convert '_' to '/'
    return $text.base64Decode(base64).replace(/\u0000/, '');
}

function promiseConf(url) {
    return new Promise((resolve, reject) => {
        $http.get({
            url: url,
            handler: function (resp) {
                let data = resp.data + ''
                let filename = url
                try {
                    let matcher = resp.response.runtimeValue().invoke('allHeaderFields').rawValue()["Content-Disposition"].match(/filename=(.*?).conf/)
                    filename = matcher[1]
                } catch (e) {
                    filename = filenameUtil.getConfName(url)
                }
                let decodedData = $text.base64Decode(data)
                let surgeConfMatcher = data.match(/\[Proxy\]([\s\S]*?)\[Proxy Group\]/)
                if (surgeConfMatcher && surgeConfMatcher[1]) {
                    // Surge托管
                    resolve({
                        servers: surgeConfMatcher[1],
                        filename: filename
                    })
                } else if (/^ssr:\/\//.test(decodedData)) {
                    // SSR订阅
                    let rawLinks = decodedData.split(/[\n\r\|\s]+/g).filter(i => i !== '');
                    let res = decodeSSR(rawLinks);
                    resolve({
                        servers: res.servers.join('\n'),
                        filename: res.sstag || filename
                    })
                } else if (/^vmess:\/\//.test(decodedData)) {
                    let rawLinks = decodedData.split(/[\n\r\|\s]+/g).filter(i => i !== '');
                    let res = decodeVmess(rawLinks);
                    resolve({
                        servers: res.servers.join('\n'),
                        filename: res.sstag || filename
                    })
                } else {
                    resolve()
                }
            }
        })
    })
}

function decodeSSR(links) {
    let tag = ''
    let first = ''
    function getParam(key, content) {
        let reg = new RegExp(`${key}=(.*?)(?:&|$)`);
        let matcher = content.match(reg);
        return matcher && matcher[1] ? matcher[1] : '';
    }
    let decodedLinks = links.map(i => {
        let rawContentMatcher = i.match(/^ssr:\/\/(.*?)$/);
        if (rawContentMatcher && rawContentMatcher[1]) {
            let rawContent = urlsaveBase64Decode(rawContentMatcher[1]);
            let rawContentParts = rawContent.split(/\/\?/g);
            let paramsMatcher = rawContentParts[0].match(/^(.*?):(.*?):(.*?):(.*?):(.*?):(.*?)$/);
            if (paramsMatcher && paramsMatcher.length === 7) {
                let host = paramsMatcher[1];
                let port = paramsMatcher[2];
                let protocol = paramsMatcher[3];
                let method = paramsMatcher[4];
                let obfs = paramsMatcher[5];
                let pass = urlsaveBase64Decode(paramsMatcher[6]);
                let obfsparam = '';
                let protoparam = '';
                let group = '';
                let remarks = '未命名节点';
                if (rawContentParts.length > 1) {
                    let target = rawContentParts[1];
                    obfsparam = urlsaveBase64Decode(getParam('obfsparam', target));
                    protoparam = urlsaveBase64Decode(getParam('protoparam', target));
                    group = urlsaveBase64Decode(getParam('group', target));
                    remarks = urlsaveBase64Decode(getParam('remarks', target));
                }
                first = remarks
                if (tag === '' && group !== '') {
                    tag = group;
                }
                let res = `${remarks} = shadowsocksr, ${host}, ${port}, ${method}, "${pass}", protocol=${protocol}, obfs=${obfs}`;
                res += protoparam ? `, protocol_param=${protoparam}` : '';
                res += obfsparam ? `, obfs_param="${obfsparam}"` : '';
                return res;
            }
            else {
                return '';
            }
        }
        else {
            return '';
        }
    });
    let sstag = first
    if (decodedLinks.length > 1) {
        sstag = `批量SSR节点（${decodedLinks.length}）`
    }
    if (tag !== '') {
        sstag = tag
    }
    return { servers: decodedLinks, sstag: sstag }
}

function getServersFromConfFile(params) {
    let promiseArray = params.urls.map(i => promiseConf(i))
    Promise.all(promiseArray).then(confs => {
        console.log(confs)
        confs.forEach((res, idx) => {
            if (!res) return
            let servers = res.servers.split(/[\n\r]+/).filter(item => item !== '').map(i => i.strictTrim())
            params.handler({ servers: servers, filename: res.filename, url: params.urls[idx] })
        })
    }).catch(reason => {
        console.error(reason.stack)
        params.handler(null)
    })
}

function decodeVmess(params) {
    let links = params.urls
    let result = []
    let tag

    for (let idx in links) {
        let link = links[idx]
        let contentMatcher = link.match(/^vmess:\/\/(.*?)$/)
        if (contentMatcher && contentMatcher[1]) {
            let encryptContent = contentMatcher[1]
            let rawContent = JSON.parse($text.base64Decode(encryptContent))
            let res = `${rawContent.ps.replace(/[\[\]]/g, '')} = vmess, ${rawContent.add}, ${rawContent.port}, aes-128-cfb, "${rawContent.id}", over-tls=${rawContent.tls === 'tls' ? 'true' : 'false'}, certificate=1`
            if (rawContent.type === 'http') {
                res += `, obfs=http, obfs-path=${rawContent.path}, obfs-header="Host: ${rawContent.host}"`
            }
            result.push(res)
            tag = rawContent.ps
        }
    }
    return { servers: result, sstag: result.length > 1 ? `批量V2Ray节点（${result.length}）` : tag }
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
                let obfsHost = obfsHostMatcher ? obfsHostMatcher[1] : 'cloudfront.net'
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

    params.handler({ servers: result, sstag: result.length > 1 ? `批量ss节点（${result.length}）` : tag })
}

module.exports = {
    proxyFromConf: getServersFromConfFile,
    proxyFromURL: decodeScheme,
    proxyFromVmess: decodeVmess,
    proxyFromSSR: decodeSSR
}