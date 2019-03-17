module.exports.getProxiesInfo = async (address) => {
    let url = `http://${address}/proxies`
    let resp = await $http.get(url)
    if ('proxies' in resp.data) {
        return genListData(resp.data.proxies)
    }
    return null
}

let genListData = (proxies) => {
    let pName = Object.keys(proxies)
    let res = []
    pName.forEach(pn => {
        let proxy = proxies[pn]
        if (proxy.type === 'Selector') {
            res.push({
                title: pn,
                rows: proxy.all.map(pan => {
                    return {
                        proxyName: { text: pan },
                        checkedIcon: { icon: pan === proxy.now ? $icon("136", $color("tint"), $size(20, 20)) : null },
                        latencyText: { text: '-- ms'}
                    }
                })
            })
        } else if (proxy.type === 'URLTest' || proxy.type === 'Fallback') {
            res.push({
                title: pn,
                rows: [{
                    proxyName: { text: proxy.now },
                    checkedIcon: { icon: $icon("089", $color("tint"), $size(20, 20)) },
                    latencyText: { text: '-- ms'}
                }]
            })
        } else if (proxy.type === 'Direct') {
            res.push({
                title: pn,
                rows: [{
                    proxyName: { text: pn },
                    checkedIcon: { icon: $icon("101", $color("tint"), $size(20, 20)) },
                    latencyText: { text: '-- ms'}
                }]
            })
        }
    })
    return res
}

module.exports.switchProxy = async (address, group, proxy) => {
    let url = `http://${address}/proxies/${encodeURI(group)}`
    let resp = await $http.request({
        url: url,
        method: 'PUT',
        body: {
            name: proxy
        }
    })
    return resp.response.statusCode === 204
}

module.exports.getConfig = async (address) => {
    let url = `http://${address}/configs`
    let resp = await $http.get(url)
    return resp.data
}

module.exports.switchMode = async (address, mode) => {
    let url = `http://${address}/configs`
    let resp = await $http.request({
        url: url,
        method: 'PATCH',
        body: {
            mode: mode
        }
    })
    console.log(resp)
}

module.exports.latencyTest = async (address, nodes) => {
    let res = await Promise.all(nodes.map(node => {
        let url = `http://${address}/proxies/${encodeURI(node)}/delay?timeout=5000&url=${encodeURI('http://www.gstatic.com/generate_204')}`
        return $http.get(url)
    }))
    return nodes.map((node, idx) => {
        return {
            name: node,
            delay: res[idx].data.delay
        }
    })
}

module.exports.sniffAddress = async () => {
    try {
        if ($device.networkType !== 1) return
        let addr = $device.wlanAddress
        let arr = Array.from(new Array(255), (val, idx) => idx + 1)
        let res = await Promise.all(arr.map(i => {
            let url = `http://${addr.replace(/.(\d*?)$/, `.${i}`)}:8080/`
            return $http.request({
                url: url,
                method: "HEAD",
                timeout: 2
            })
        }))
        console.log('嗅探完毕')
        let idx = res.findIndex(i => i.response)
        return idx === -1 ? '' : addr.replace(/.(\d*?)$/, `.${idx + 1}`) + ':8080'
    } catch (e) {
        console.error(e.stack)
    }
}