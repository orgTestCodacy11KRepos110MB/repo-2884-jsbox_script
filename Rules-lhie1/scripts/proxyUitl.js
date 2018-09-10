const filenameUtil = require('scripts/filenameUtil')

String.prototype.strictTrim = function () {
    let trimed = this.trim()
    if ((matcher = trimed.match(/([\s\S]+),$/)) !== null) {
        return matcher[1]
    }
    return trimed
}

function urlsafeBase64Encode(url) {
    return $text.base64Encode(url).replace(/\-/g, '+').replace(/\\/g, '_').replace(/=+$/, '')
}

function urlsafeBase64Decode(base64) {
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
            header: {
                'User-Agent': 'Surge/1174 CFNetwork/962 Darwin/18.0.0'
            },
            handler: function (resp) {
                let data = resp.data + ''
                let filename = url
                try {
                    let matcher = resp.response.runtimeValue().invoke('allHeaderFields').rawValue()["Content-Disposition"].match(/filename="?(.*?)(?:.conf|"|$)/)
                    filename = matcher[1]
                } catch (e) {
                    filename = filenameUtil.getConfName(url)
                }
                // 兼容不规范ssr链接
                let noPaddingData = data
                let padding = noPaddingData.length % 4 == 0 ? 0 : 4 - noPaddingData.length % 4
                for (let i = 0; i < padding; i++) {
                    noPaddingData += '='
                }
                let decodedData = $text.base64Decode(data) || $text.base64Decode(noPaddingData)
                if (/\[Proxy\]([\s\S]*?)\[Proxy Group\]/.test(data)) {
                    // Surge托管
                    resolve({
                        servers: RegExp.$1,
                        filename: filename
                    })
                } else if (/^ssr:\/\//.test(decodedData)) {
                    // SSR订阅
                    let rawLinks = decodedData.split(/[\n\r\|\s]+/g).filter(i => i !== '' && /^ssr:\/\//.test(i));
                    let res = decodeSSR(rawLinks);
                    resolve({
                        servers: res.servers.join('\n'),
                        filename: res.sstag || filename
                    })
                } else if (/^ss:\/\//.test(decodedData)) {
                    // SS订阅
                    let rawLinks = decodedData.split(/[\n\r\|\s]+/g).filter(i => i !== '' && /^ss:\/\//.test(i));
                    decodeScheme({
                        ssURL: rawLinks,
                        handler: serInfo => {
                            resolve({
                                servers: serInfo.servers.join('\n'),
                                filename: serInfo.sstag || filename
                            })
                        }
                    });
                } else if (/^vmess:\/\//.test(decodedData)) {
                    let rawLinks = decodedData.split(/[\n\r\|\s]+/g).filter(i => i !== '' && /^vmess:\/\//.test(i));
                    console.log('rawLinks', typeof rawLinks);
                    let res = decodeVmess(rawLinks);
                    console.log('res', res);
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
            let rawContent = urlsafeBase64Decode(rawContentMatcher[1]);
            let rawContentParts = rawContent.split(/\/*\?/g)
            let paramsMatcher = rawContentParts[0].match(/^(.*?):(.*?):(.*?):(.*?):(.*?):(.*?)$/);
            if (paramsMatcher && paramsMatcher.length === 7) {
                let host = paramsMatcher[1];
                let port = paramsMatcher[2];
                let protocol = paramsMatcher[3];
                let method = paramsMatcher[4];
                let obfs = paramsMatcher[5];
                let pass = urlsafeBase64Decode(paramsMatcher[6]);
                let obfsparam = '';
                let protoparam = '';
                let group = '';
                let remarks = '';
                if (rawContentParts.length > 1) {
                    let target = rawContentParts[1];
                    obfsparam = urlsafeBase64Decode(getParam('obfsparam', target));
                    protoparam = urlsafeBase64Decode(getParam('protoparam', target));
                    group = urlsafeBase64Decode(getParam('group', target));
                    remarks = urlsafeBase64Decode(getParam('remarks', target));
                }
                if (tag === '' && group !== '') {
                    tag = group;
                }
                let finalName = remarks === '' ? `${host}:${port}` : remarks
                first = finalName
                let res = `${finalName} = shadowsocksr, ${host}, ${port}, ${method}, "${pass}", protocol=${protocol}, obfs=${obfs}`;
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
        for (let idx in confs) {
            let res = confs[idx]
            let filename = res ? res.filename : '';
            let servers = res ? res.servers.split(/[\n\r]+/).filter(item => item !== '').map(i => i.strictTrim()) : [];
            console.log('{ servers: servers, filename: filename, url: params.urls[idx] }', { servers: servers, filename: filename, url: params.urls[idx] });
            params.handler({ servers: servers, filename: filename, url: params.urls[idx] })
        }
    }).catch(reason => {
        console.error(reason.stack)
        params.handler(null)
    })
}

function isJson(str) {
    try {
        JSON.parse(str)
    } catch(e) {
        return false
    }
    return true
}

function decodeVmess(links) {
    let result = []
    let tag = ''

    for (let idx in links) {
        let link = links[idx]

        if (/^vmess:\/\/(.*?)$/.test(link)) {
            let content = urlsafeBase64Decode(RegExp.$1)
            if (isJson(content)) {
                // v2rayN style
                let jsonConf = JSON.parse(content)
                let group = ''
                const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A5366a'
                let obfs = `,obfs=${jsonConf.net === 'ws' ? 'ws' : 'http'},obfs-path="${jsonConf.path || '/'}",obfs-header="Host:${jsonConf.host || jsonConf.add}[Rr][Nn]User-Agent:${ua}"`
                let quanVmess = `${jsonConf.ps} = vmess,${jsonConf.add},${jsonConf.port},chacha20-ietf-poly1305,"${jsonConf.id}",group=${group},over-tls=${jsonConf.tls === 'tls' ? 'true' : 'false'},certificate=1${jsonConf.type === 'none' && jsonConf.net !== 'ws' ? '' : obfs}`
                result.push(quanVmess)
            } else {
                // Quantumult style
                if (/group=(.*?),/.test(content)) {
                    tag = RegExp.$1
                }
                result.push(content)
            }
        }
    }
    return { servers: result, sstag: tag || `批量V2Ray节点（${result.length}）`}
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
            [_, method, password, hostname, port] = $text.base64Decode(mdps).match(/^(.*?):(.*?)@(.*?):(.*?)$/)
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