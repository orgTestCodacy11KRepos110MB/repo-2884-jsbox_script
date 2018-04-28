const proxyUtil = require('scripts/proxyUitl')
const FILE = 'data.js'

if (!$file.exists(FILE)) {
    $file.write({
        data: $data({ "string": JSON.stringify({ "urls": [] })}),
        path: FILE
    })
}

let selectedProxies = []

function renderUI() {
    $ui.render({
        props: {
            title: "Surge规则"
        },
        views: [{
            type: "scroll",
            props: {
                id: "mainView"
            },
            layout: $layout.fill,
            views: [{
                type: "input",
                props: {
                    id: "fileName",
                    text: '',
                    placeholder: "文件名（不带.conf），留空则为lhie1"
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super).offset(-20)
                    make.centerX.equalTo(view.super)
                    make.height.equalTo(40)
                    make.top.equalTo(10)
                },
                events: {
                    returned: sender => {
                        $("fileName").blur()
                    }
                }
            }, {
                type: "button",
                props: {
                    id: "serverURL",
                    title: "导入节点"
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super).offset(-20)
                    make.centerX.equalTo(view.super)
                    make.height.equalTo(40)
                    make.top.equalTo($("fileName").bottom).offset(10)
                },
                events: {
                    tapped: sender => {
                        importMenu({
                            handler: res => {
                                if (!res) {
                                    $ui.alert("没有检测到节点信息")
                                }
                                for (let idx in res) {
                                    $("serverEditor").insert({
                                        index: 0,
                                        value: {
                                            proxyName: { text: res[idx].split('=')[0].trim() },
                                            proxyLink: res[idx]
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            }, {
                type: "list",
                props: {
                    id: "serverEditor",
                    data: [],
                    actions: [{
                        title: "delete"
                    }],
                    // rowHeight: 40,
                    borderWidth: 3,
                    borderColor: $color("#f0f5f5"),
                    template: {
                        views: [{
                            type: 'label',
                            props: {
                                id: 'proxyName',
                                align: $align.center,
                                autoFontSize: true
                            },
                            layout: $layout.fill
                        }]
                    },
                    radius: 5
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super).offset(-20)
                    make.centerX.equalTo(view.super)
                    make.height.equalTo(150)
                    make.top.equalTo($("serverURL").bottom).offset(10)
                },
                events: {
                    didSelect: (sender, indexPath, data) => {
                        let proxyName = data.proxyName.text
                        let itemIdx = selectedProxies.indexOf(proxyName)
                        if (itemIdx < 0) {
                            selectedProxies.push(proxyName)
                        } else {
                            selectedProxies.splice(itemIdx, 1)
                        }
                        $("autoGroup").text = selectedProxies.join('\n')
                    }
                }
            }, {
                type: "text",
                props: {
                    id: "autoGroup",
                    radius: 5,
                    editable: false,
                    // bgcolor: $color("#f0f5f5"),
                    borderWidth: 3,
                    borderColor: $color("#f0f5f5"),
                    // font: $font(12),
                    align: $align.center,
                    text: 'Auto节点，点击☝️选择至少一个'
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super).offset(-20)
                    make.centerX.equalTo(view.super)
                    make.height.equalTo(80)
                    make.top.equalTo($("serverEditor").bottom).offset(10)
                }
            }, {
                type: "switch",
                props: {
                    id: "adsSwitch"
                },
                layout: (make, view) => {
                    make.width.equalTo(40)
                    make.height.equalTo(40)
                    make.top.equalTo($("autoGroup").bottom).offset(10)
                    make.right.equalTo($("autoGroup").right).offset(-10)
                }
            }, {
                type: "label",
                props: {
                    text: "去广告",
                },
                layout: (make, view) => {
                    make.width.equalTo(200)
                    make.height.equalTo(40)
                    make.left.equalTo(10)
                    make.top.equalTo($("autoGroup").bottom).offset(6)
                }
            }, {
                type: "switch",
                props: {
                    id: "tfSwitch"
                },
                layout: (make, view) => {
                    make.width.equalTo(40)
                    make.height.equalTo(40)
                    make.top.equalTo($("adsSwitch").bottom)
                    make.right.equalTo($("adsSwitch").right)
                    make.bottom.equalTo(view.super).offset(-50)
                }
            }, {
                type: "label",
                props: {
                    text: "TestFlight",
                },
                layout: (make, view) => {
                    make.width.equalTo(200)
                    make.height.equalTo(40)
                    make.left.equalTo(10)
                    make.top.equalTo($("adsSwitch").bottom)
                    make.bottom.equalTo(view.super).offset(-50)
                }
            }]
        }, {
            type: "button",
            props: {
                id: "genBtn",
                title: "拉取规则并生成配置文件"
            },
            layout: (make, view) => {
                make.width.equalTo(view.super).offset(-20)
                make.centerX.equalTo(view.super)
                make.height.equalTo(40)
                make.bottom.equalTo(view.super).offset(-10)
            },
            events: {
                tapped: sender => {
                    $ui.loading(true)
                    let pu = {
                        apple: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/Apple.conf',
                        direct: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/DIRECT.conf',
                        proxy: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/PROXY.conf',
                        reject: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/REJECT.conf',
                        testflight: 'https://raw.githubusercontent.com/lhie1/Rules/master/Surge/TestFlight.conf',
                        host: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/HOST.conf',
                        urlrewrite: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/URL%20Rewrite.conf',
                        urlreject: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/URL%20REJECT.conf',
                        headerrewrite: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/Header%20Rewrite.conf',
                        hostname: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/Hostname.conf',
                        mitm: 'https://raw.githubusercontent.com/lhie1/Rules/master/Surge/MITM.conf'
                    }
                    let ads = $("adsSwitch").on
                    let isTF = $("tfSwitch").on

                    let autoGroup = selectedProxies.join(', ')
                    let proxies = $("serverEditor").data.map(i => i.proxyLink).join('\n')
                    let proxyHeaders = $("serverEditor").data.map(i => i.proxyName.text).join(', ')
                    let rules = ''
                    let prototype = ''
                    let testFlight = ''
                    let host = ''
                    let urlRewrite = ''
                    let urlReject = ''
                    let headerRewrite = ''
                    let hostName = ''
                    let mitm = ''
                    getPrototype().then(res => {
                        prototype = res
                        return getAutoRules(pu.apple)
                    }).then(res => {
                        rules += '\n' + res
                        return getAutoRules(pu.direct)
                    }).then(res => {
                        rules += '\n' + res
                        return getAutoRules(pu.proxy)
                    }).then(res => {
                        rules += '\n' + res
                        if (ads) {
                            return getAutoRules(pu.reject)
                        } else {
                            return Promise.resolve('')
                        }
                    }).then(res => {
                        rules += '\n' + res
                        if (isTF) {
                            return getAutoRules(pu.testflight)
                        } else {
                            return Promise.resolve('')
                        }
                    }).then(res => {
                        testFlight = res
                        return getAutoRules(pu.host)
                    }).then(res => {
                        host = res
                        return getAutoRules(pu.urlrewrite)
                    }).then(res => {
                        urlRewrite += res
                        return getAutoRules(pu.urlreject)
                    }).then(res => {
                        urlReject += res
                        return getAutoRules(pu.headerrewrite)
                    }).then(res => {
                        headerRewrite = res
                        return getAutoRules(pu.hostname)
                    }).then(res => {
                        hostName = 'hostname = ' + res.split('\n').join(', ')
                        return getAutoRules(pu.mitm)
                    }).then(res => {
                        mitm = res

                        $ui.loading(false)

                        prototype = prototype.replace('Proxys', proxies)
                        prototype = prototype.split('Proxy Header').join(proxyHeaders)
                        prototype = prototype.replace('ProxyHeader', autoGroup)
                        prototype = prototype.replace('# All Rules', rules)
                        prototype = prototype.replace('// TestFlight', testFlight)
                        prototype = prototype.replace('# Host', host)
                        prototype = prototype.replace('# URL Rewrite', urlRewrite)
                        prototype = prototype.replace('# URL REJECT', urlReject)
                        prototype = prototype.replace('# Header Rewrite', headerRewrite)
                        prototype = prototype.replace('// Hostname', hostName)
                        prototype = prototype.replace('# MITM', mitm)

                        console.log(prototype)
                        $share.sheet([($("fileName").text || 'lhie1') + '.conf', $data({ "string": prototype })])
                    }).catch(() => {
                        $ui.loading(false)
                        $ui.alert("无法生成配置文件，可能是规则仓库发生变化或网络出现问题")
                    })
                }
            }
        }]
    })
}

function getPrototype() {
    return new Promise((resolve, reject) => {
        $http.get({
            url: "https://raw.githubusercontent.com/lhie1/Rules/master/Surge/Prototype.conf",
            handler: function (resp) {
                resolve(resp.data)
            }
        })
    })
}

function getAutoRules(url) {
    return new Promise((resolve, reject) => {
        $http.get({
            url: url,
            handler: function (resp) {
                resolve(resp.data)
            }
        })
    })
}

function importMenu(params) {
    let staticItems = ['剪贴板', '相机扫码', '相册']
    let savedURLS = JSON.parse($file.read(FILE).string).urls
    console.log(savedURLS)
    for (let i = 0; i < savedURLS.length && i < 3; i++) {
        staticItems.unshift(savedURLS[i])
    }
    $ui.menu({
        items: staticItems,
        handler: function (title, idx) {
            let staticIdx = idx - savedURLS.length
            if (staticIdx == 0) {
                let clipText = $clipboard.text
                linkHandler(clipText, params)
            } else if (staticIdx == 1) {
                $qrcode.scan({
                    handler(string) {
                        linkHandler(string, params)
                    }
                })
            } else if (staticIdx == 2) {
                $photo.pick({
                    format: "image",
                    handler: function (resp) {
                        var image = resp.image
                        linkHandler($qrcode.decode(image), params)
                    }
                })
            } else {
                linkHandler(title, params)
            }
        }
    })
}

function linkHandler (url, params) {
    if (url.startsWith('ss')) {
        proxyUtil.proxyFromURL({
            ssURL: url.trim(),
            handler: res => {
                params.handler(res)
            }
        })
        saveURL(url)
    } else if (url.startsWith('http')) {
        $ui.loading(true)
        proxyUtil.proxyFromConf({
            confURL: url.trim(),
            handler: res => {
                params.handler(res)
                $ui.loading(false)
            }
        })
        saveURL(url)
    } else {
        params.handler(null)
    }
}

function saveURL (url) {
    let urls = JSON.parse($file.read(FILE).string).urls
    if (urls.indexOf(url) >= 0) {
        urls.splice(urls.indexOf(url), 1)
    }
    urls.push(url)
    if (urls.length > 3) {
        urls.shift()
    }
    $file.write({
        data: $data({ "string": JSON.stringify({ "urls": urls}) }),
        path: FILE
    })
}

module.exports = {
    renderUI: renderUI
}