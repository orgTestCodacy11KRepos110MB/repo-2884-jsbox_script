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
                let surgeConfMatcher = data.match(/\[Proxy\]([\s\S]*?)\[Proxy Group\]/)
                if (surgeConfMatcher && surgeConfMatcher[1]) {
                    // Surge托管
                    resolve({
                        servers: surgeConfMatcher[1],
                        filename: filename
                    })
                } else if (/ssr:\/\//.test(decodedData)) {
                    // SSR订阅
                    let rawLinks = decodedData.split(/[\n\r\|\s]+/g).filter(i => i !== '' && /^ssr:\/\//.test(i));
                    let res = decodeSSR(rawLinks);
                    resolve({
                        servers: res.servers.join('\n'),
                        filename: res.sstag || filename
                    })
                } else if (/ss:\/\//.test(decodedData)) {
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
                } else if (/vmess:\/\//.test(decodedData)) {
                    let rawLinks = decodedData.split(/[\n\r\|\s]+/g).filter(i => i !== '' && /^vmess:\/\//.test(i));
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
            let rawContent = urlsafeBase64Decode(rawContentMatcher[1]);
            let rawContentParts = rawContent.split(/\/*\?/g)
            console.log(rawContentParts)
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
            params.handler({ servers: servers, filename: filename, url: params.urls[idx] })
        }
    }).catch(reason => {
        console.error(reason.stack)
        params.handler(null)
    })
}

function decodeVmess(links) {
    let result = []
    let tag

    for (let idx in links) {
        let link = links[idx]
        let isV2RayNV2 = /^vmess:\/\/\S+\?/.test(link)
        if (isV2RayNV2) {
            let contentMatcher = link.match(/^vmess:\/\/(.*?)\?(.*?)$/)
            if (contentMatcher && contentMatcher.length === 3) {
                let encryptContent = contentMatcher[1]
                let params = contentMatcher[2].split(/&/g).map(i => i.split(/=/))
                let rawContent = urlsafeBase64Decode(encryptContent)
                let rawContentMatcher = rawContent.match(/^(.*?):(.*?)@(.*?):(.*?)$/)
                let getParam = key => {
                    let target = params.find(i => i[0] === key)
                    if (target && target[1]) {
                        return target[1]
                    }
                    return ''
                }
                if (rawContentMatcher && rawContentMatcher.length === 5) {
                    let remark = getParam('remark') || getParam('remarks') || ''
                    let finalName = decodeURI(remark) === '' ? `${rawContentMatcher[3]}:${rawContentMatcher[4]}` : decodeURI(remark)
                    let res = `${finalName} = vmess, ${rawContentMatcher[3]}, ${rawContentMatcher[4]}, aes-128-cfb, "${rawContentMatcher[2]}", over-tls=${getParam('tls') === '1' ? 'true' : 'false'}, certificate=${getParam('allowInsecure') === '1' ? '0' : '1'}`
                    result.push(res)
                    tag = finalName
                }
            }
        } else {
            let contentMatcher = link.match(/^vmess:\/\/(.*?)$/)
            if (contentMatcher && contentMatcher[1]) {
                let encryptContent = contentMatcher[1]
                let rawContent = JSON.parse($text.base64Decode(encryptContent))
                let res = `${rawContent.ps} = vmess, ${rawContent.add}, ${rawContent.port}, aes-128-cfb, "${rawContent.id}", over-tls=${rawContent.tls === 'tls' ? 'true' : 'false'}, certificate=1`
                if (rawContent.type === 'http') {
                    res += `, obfs=http, obfs-path=${rawContent.path}, obfs-header="Host: ${rawContent.host}"`
                }
                result.push(res)
                tag = rawContent.ps
            }
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