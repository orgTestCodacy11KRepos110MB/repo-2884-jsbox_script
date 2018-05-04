const proxyUtil = require('scripts/proxyUitl')
const su = require('scripts/sizeUtil')
const cu = require('scripts/colorUtil')
const FILE = 'data.js'

const settingKeys = ['generalSettings', 'proxyGroupSettings', 'customSettings', 'mitmSettings']

if (!$file.exists(FILE)) {
    $file.write({
        data: $data({ "string": JSON.stringify({ "urls": [] }) }),
        path: FILE
    })
}

setDefaultSettings()

let screenHeight = $device.info.screen.height
const screenWidth = $device.info.screen.width

const iPhoneX = screenWidth == 375 && screenHeight == 812
if (iPhoneX) {
    screenHeight -= 48
}

const selectedColor = $color("#d1e0e0")
const defaultColor = $color("#ffffff")
const tintColor = $color("#ff2d55")
const blackColor = $color("#000000")


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
            events: {
                willEndDragging: (sender, velocity) => {
                    let vy = velocity.runtimeValue().invoke("CGPointValue").y
                    $("serverEditor").updateLayout((make, view) => {
                        make.height.equalTo(screenHeight - (vy >= 0 ? 380 : 330))
                    })
                }
            },
            views: [{
                type: "input",
                props: {
                    id: "fileName",
                    text: '',
                    placeholder: "配置名（lhie1)"
                },
                layout: (make, view) => {
                    make.width.equalTo(screenWidth / 2 - 15)
                    // make.centerX.equalTo(view.super)
                    make.height.equalTo(40)
                    make.left.top.equalTo(10)
                },
                events: {
                    returned: sender => {
                        $("fileName").blur()
                        saveWorkspace()
                    }
                }
            }, {
                type: "button",
                props: {
                    id: "serverURL",
                    title: "导入节点"
                },
                layout: (make, view) => {
                    make.width.equalTo(screenWidth / 2 - 15)
                    // make.centerX.equalTo(view.super)
                    make.height.equalTo(40)
                    // make.top.equalTo($("fileName").bottom).offset(10)
                    make.left.equalTo($("fileName").right).offset(10)
                    make.top.right.equalTo(10)
                },
                events: {
                    tapped: sender => {
                        importMenu({
                            handler: res => {
                                if (!res) {
                                    $ui.alert("没有检测到节点信息")
                                }
                                let listData = $("serverEditor").data || []
                                for (let idx in res) {
                                    if (res[idx].split("=")[1].trim() == 'direct') {
                                        continue
                                    }
                                    listData.push({
                                        proxyName: { text: res[idx].split('=')[0].trim(), bgcolor: defaultColor },
                                        proxyLink: res[idx]
                                    })
                                }
                                $("serverEditor").data = listData
                                saveWorkspace()
                            }
                        })
                    }
                }
            }, {
                type: "matrix",
                props: {
                    id: "serverControl",
                    columns: 3,
                    // radius: 5,
                    itemHeight: 40,
                    bgcolor: $color("#f0f5f5"),
                    data: [{
                        title: { text: '倒序' }
                    }, {
                        title: { text: '全部Auto' }
                    }, {
                        title: { text: '清空' }
                    }],
                    template: [{
                        type: "label",
                        props: {
                            id: "title",
                            align: $align.center
                        },
                        layout: $layout.fill
                    }]
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super).offset(-20)
                    make.centerX.equalTo(view.super)
                    make.height.equalTo(40)
                    make.top.equalTo($("serverURL").bottom).offset(10)
                },
                events: {
                    didSelect: (sender, indexPath, data) => {
                        if (indexPath.item == 0) {
                            let rd = $("serverEditor").data.reverse()
                            $("serverEditor").data = rd
                        } else if (indexPath.item == 1) {
                            let data = $("serverEditor").data.map(i => {
                                i.proxyName.bgcolor = selectedColor
                                return i
                            })
                            $("serverEditor").data = data
                        } else if (indexPath.item == 2) {
                            $("serverEditor").data = []
                        }
                        saveWorkspace()
                    }
                }
            }, {
                type: "list",
                props: {
                    id: "serverEditor",
                    data: [],
                    reorder: true,
                    actions: [{
                        title: "delete",
                        handler: (sender, indexPath) => {
                            saveWorkspace()
                        }
                    }, {
                        title: "重命名",
                        handler: (sender, indexPath) => {
                            let titleText = sender.object(indexPath).proxyName.text
                            $input.text({
                                type: $kbType.default,
                                placeholder: "请输入节点名",
                                text: titleText == '无节点名称' ? "" : titleText,
                                handler: function (text) {
                                    let od = $("serverEditor").data
                                    od[indexPath.row].proxyName.text = text
                                    let proxyURLNoName = od[indexPath.row].proxyLink.split("=")
                                    proxyURLNoName.shift()
                                    od[indexPath.row].proxyLink = `${text} =${proxyURLNoName.join("=")}`
                                    console.log(od[indexPath.row])
                                    $("serverEditor").data = od
                                    saveWorkspace()
                                }
                            })
                        }
                    }],
                    borderWidth: 2,
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
                    // radius: 5
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super).offset(-20)
                    make.centerX.equalTo(view.super)
                    make.height.equalTo(screenHeight - 330)
                    make.top.equalTo($("serverControl").bottom)
                },
                events: {
                    didSelect: (sender, indexPath, data) => {
                        let proxyName = data.proxyName.text
                        data.proxyName.bgcolor = cu.isEqual(data.proxyName.bgcolor, selectedColor) ? defaultColor : selectedColor
                        let uiData = $("serverEditor").data
                        uiData[indexPath.row] = data
                        $("serverEditor").data = uiData
                        saveWorkspace()
                    },
                    reorderFinished: data => {
                        $("serverEditor").data = data
                        saveWorkspace()
                    }
                }
            }, {
                type: "matrix",
                props: {
                    id: "usualSettings",
                    columns: 2,
                    // radius: 5,
                    itemHeight: 40,
                    // bgcolor: $color("#f0f5f5"),
                    // borderWidth: 1,
                    // borderColor: $color("#f0f5f5"),
                    spacing: 5,
                    selectable: true,
                    data: [{
                        title: { text: '去广告', bgcolor: defaultColor, textColor: blackColor }
                    }, {
                        title: { text: '开启MITM', bgcolor: defaultColor, textColor: blackColor }
                    }, {
                        title: { text: 'UDP', bgcolor: defaultColor, textColor: blackColor }
                    }, {
                        title: { text: '分享配置', bgcolor: defaultColor, textColor: blackColor }
                    }],
                    template: [{
                        type: "label",
                        props: {
                            id: "title",
                            align: $align.center,
                            font: $font(14),
                            radius: 5,
                            borderColor: tintColor,
                            borderWidth: 1,
                        },
                        layout: $layout.fill
                    }]
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super).offset(-10)
                    make.centerX.equalTo(view.super)
                    make.height.equalTo(100)
                    make.top.equalTo($("serverEditor").bottom).offset(10)
                },
                events: {
                    didSelect: (sender, indexPath, data) => {
                        data.title.bgcolor = cu.isEqual(data.title.bgcolor, tintColor) ? defaultColor : tintColor
                        data.title.textColor = cu.isEqual(data.title.bgcolor, tintColor) ? defaultColor : blackColor
                        let uiData = $("usualSettings").data
                        uiData[indexPath.row] = data
                        $("usualSettings").data = uiData
                        saveWorkspace()
                    }
                }
            },]
        }, {
            type: "button",
            props: {
                id: "advanceBtn",
                title: "进阶设置",
                bgcolor: $color("#808080")
            },
            layout: (make, view) => {
                make.width.equalTo(screenWidth * 0.314 - 15)
                // make.centerX.equalTo(view.super)
                make.left.equalTo(10)
                make.height.equalTo(40)
                make.top.equalTo($("usualSettings").bottom).offset(5)
            },
            events: {
                tapped: sender => {
                    renderAdvanceUI()
                }
            }
        }, {
            type: "button",
            props: {
                id: "genBtn",
                title: "拉取规则生成配置"
            },
            layout: (make, view) => {
                make.width.equalTo(screenWidth * 0.686 - 15)
                // make.centerX.equalTo(view.super)
                make.height.equalTo(40)
                make.left.equalTo($("advanceBtn").right).offset(10)
                make.top.equalTo($("usualSettings").bottom).offset(5)
            },
            events: {
                tapped: sender => {
                    // $ui.loading(true)
                    $("progressView").hidden = false

                    $ui.animate({
                        duration: 0.2,
                        animation: function () {
                            $("progressView").alpha = 1
                        }
                    })

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
                    let ads = cu.isEqual($("usualSettings").data[0].title.bgcolor, tintColor)
                    let isMitm = cu.isEqual($("usualSettings").data[1].title.bgcolor, tintColor)
                    let isTF = cu.isEqual($("usualSettings").data[2].title.bgcolor, tintColor)
                    let isActionSheet = cu.isEqual($("usualSettings").data[3].title.bgcolor, tintColor)

                    console.log([ads, isTF, isMitm])

                    let advanceSettings = JSON.parse($file.read(FILE).string)

                    let autoGroup = $("serverEditor").data.filter(i => cu.isEqual(i.proxyName.bgcolor, selectedColor)).map(i => i.proxyName.text).join(',') || 'DIRECT'
                    let proxies = $("serverEditor").data.map(i => {
                        return i.proxyLink + (isTF ? ',udp-relay=true' : '')
                    }).join('\n')
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
                        $("progressBar").value = 0.1
                        prototype = res
                        return getAutoRules(pu.apple)
                    }).then(res => {
                        $("progressBar").value = 0.2
                        rules += '\n' + res
                        if (ads) {
                            return getAutoRules(pu.reject)
                        } else {
                            return Promise.resolve('')
                        }
                    }).then(res => {
                        $("progressBar").value = 0.3
                        rules += '\n' + res.split("REJECT").join("REJECT-TINYGIF")
                        return getAutoRules(pu.proxy)
                    }).then(res => {
                        $("progressBar").value = 0.4
                        rules += '\n' + res
                        return getAutoRules(pu.direct)
                    }).then(res => {
                        $("progressBar").value = 0.5
                        rules += '\n' + res
                        return getAutoRules(pu.host)
                    }).then(res => {
                        $("progressBar").value = 0.6
                        host = res
                        return getAutoRules(pu.urlrewrite)
                    }).then(res => {
                        $("progressBar").value = 0.7
                        urlRewrite += res
                        if (ads) {
                            return getAutoRules(pu.urlreject)
                        } else {
                            return Promise.resolve('')
                        }
                    }).then(res => {
                        $("progressBar").value = 0.8
                        urlReject += res
                        return getAutoRules(pu.headerrewrite)
                    }).then(res => {
                        $("progressBar").value = 0.9
                        headerRewrite = res
                        return getAutoRules(pu.hostname)
                    }).then(res => {
                        $("progressBar").value = 1
                        hostName = 'hostname = ' + res.split('\n').join(', ')

                        if (advanceSettings.proxyGroupSettings) {
                            prototype = prototype.replace(/\[Proxy Group\][\s\S]+\[Rule\]/, advanceSettings.proxyGroupSettings + '\n\n[Rule]')
                        }

                        if (advanceSettings.generalSettings) {
                            prototype = prototype.replace(/\[General\][\s\S]+\[Proxy\]/, advanceSettings.generalSettings + '\n\n[Proxy]')
                        }

                        console.log(proxyHeaders)
                        console.log(prototype)

                        // prototype = prototype.replace('dns-server = system', advanceSettings.dnsSettings || 'dns-server = system,1.2.4.8,80.80.80.80,80.80.81.81,1.1.1.1,1.0.0.1')
                        prototype = prototype.replace('# Custom', advanceSettings.customSettings)
                        prototype = prototype.replace('Proxys', proxies)
                        prototype = prototype.split('Proxy Header').join(proxyHeaders)
                        prototype = prototype.replace('ProxyHeader', autoGroup)
                        prototype = prototype.replace('# All Rules', rules)
                        prototype = prototype.replace('# Host', host)
                        prototype = prototype.replace('# URL Rewrite', urlRewrite)
                        prototype = prototype.replace('# URL REJECT', urlReject)
                        prototype = prototype.replace('# Header Rewrite', headerRewrite)
                        prototype = prototype.replace('// Hostname', hostName)

                        if (isMitm) {
                            prototype = prototype.replace('# MITM', advanceSettings.mitmSettings)
                        } else {
                            prototype = prototype.replace('# MITM', "")
                        }

                        $ui.animate({
                            duration: 0.3,
                            animation: function () {
                                $("progressView").alpha = 0
                            },
                            completion: function () {
                                $("progressView").value = 0
                                $("progressView").hidden = true
                            }
                        })

                        let fn = ($("fileName").text || 'lhie1') + '.conf'
                        let fnReg = /^[\x21-\x2A\x2C-\x2E\x30-\x3B\x3D\x3F-\x5B\x5D\x5F\x61-\x7B\x7D-\x7E]+$/

                        if (isActionSheet || !fnReg.test(fn)) {
                            $share.sheet([fn, $data({ "string": prototype })])
                        } else {
                            if (!$file.exists("confs")) {
                                $file.mkdir("confs")
                            }
                            $file.write({
                                data: $data({ "string": prototype }),
                                path: `confs/${fn}`
                            })
                            $http.startServer({
                                path: "confs/",
                                header: {
                                    "Content-Disposition": "inline"
                                },
                                handler: res => {
                                    let serverUrl = `http://127.0.0.1:${res.port}/`
                                    $http.get({
                                        url: serverUrl + "list?path=" + fn,
                                        handler: function (resp) {
                                            let surgeScheme = `surge:///install-config?url=${encodeURIComponent(serverUrl + "download?path=" + fn)}`
                                            // $ui.alert((res.url + "download?path=" + fn))
                                            $app.openURL(surgeScheme)
                                        }
                                    })
                                }
                            })
                            $app.listen({
                                resume: () => {
                                    $http.stopServer()
                                }
                            })
                        }
                    }).catch(() => {
                        $("progressView").value = 0
                        $("progressView").hidden = true

                        $ui.alert("无法生成配置文件，可能是规则仓库发生变化或网络出现问题")
                    })
                }
            }
        }, {
            type: "blur",
            props: {
                id: "progressView",
                style: 1,
                alpha: 0,
                hidden: true
            },
            layout: $layout.fill,
            views: [{
                type: "label",
                props: {
                    text: "处理中，请稍后",
                    textColor: $color("black"),
                },
                layout: (make, view) => {
                    make.centerX.equalTo(view.super)
                    make.centerY.equalTo(view.super).offset(-30)
                }
            }, {
                type: "progress",
                props: {
                    id: "progressBar",
                    value: 0
                },
                layout: (make, view) => {
                    make.width.equalTo(screenWidth * 0.8)
                    make.center.equalTo(view.super)
                    make.height.equalTo(3)
                }
            }]
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
    let staticItems = ['剪贴板', '二维码']
    let savedURLS = JSON.parse($file.read(FILE).string).urls
    console.log(savedURLS)
    for (let i = 0; i < savedURLS.length && i < 3; i++) {
        staticItems.unshift(savedURLS[i].name || savedURLS[i])
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
            } else {
                let lm = savedURLS.length - 1
                let url = savedURLS[lm - idx].url || savedURLS[lm - idx]
                linkHandler(url, params)
            }
        }
    })
}

function linkHandler(url, params) {
    if (url.startsWith('ss')) {
        proxyUtil.proxyFromURL({
            ssURL: url.trim(),
            handler: res => {
                params.handler(res.servers)
                saveURL(url, res.sstag)
            }
        })

    } else if (url.startsWith('http')) {
        $ui.loading(true)
        proxyUtil.proxyFromConf({
            confURL: url.trim(),
            handler: res => {
                params.handler(res.servers)
                $ui.loading(false)
                saveURL(url, res.filename)
            }
        })
    } else if (/[\S\s]+=[\s]*custom,/.test(url)) {
        let urls = url.split('\n').map(i => i.trim()).filter(i => /[\S\s]+=[\s]*custom,/.test(i)).map(i => i.replace(/,[\s]*udp-relay=true/, ''))
        let result = []
        for (let idx in urls) {
            result[idx] = urls[idx]
        }
        params.handler(result)
        saveURL(url, urls.length > 1 ? `批量Surge链接（${urls.length}）` : result[0].split('=')[0].trim())
    } else {
        params.handler(null)
    }
}

function saveURL(url, name) {
    let settings = JSON.parse($file.read(FILE).string)
    let urls = settings.urls
    let idx = -1
    urls.forEach((item, i) => {
        if (item == url || item.url == url) {
            idx = i
        }
    })
    if (idx > -1) {
        urls.splice(idx, 1)
    }
    urls.push({ url: url, name: name })
    if (urls.length > 3) {
        urls.shift()
    }
    $file.write({
        data: $data({ "string": JSON.stringify(settings) }),
        path: FILE
    })
}

function write2file(key, value) {
    let content = JSON.parse($file.read(FILE).string)
    content[key] = value
    $file.write({
        data: $data({ "string": JSON.stringify(content) }),
        path: FILE
    })
}

function renderAdvanceUI() {
    let previewData = JSON.parse($file.read(FILE).string)
    let inputViewData = []
    for (let idx in settingKeys) {
        let content = previewData[settingKeys[idx]]
        inputViewData.push({
            type: "text",
            props: {
                text: content,
                bgcolor: $color("#f0f5f5"),
                font: $font(14)
            },
            events: {
                didEndEditing: sender => {
                    let content = sender.text
                    if (sender.text == '') {
                        content = $file.read('defaultConf/' + settingKeys[idx]).string
                        sender.text = content
                    }
                    write2file(settingKeys[idx], content)
                }
            }
        })
    }
    let genControlBnts = function(idx) {
        let titleTexts = ['General', 'Proxy Group', 'Custom Rule', 'MITM']
        return titleTexts.map((item, i) => {
            return {
                title: { text: item, bgcolor: i == idx? $color("#ffcc66"): $color("#cc6666"), radius: 5, color: i == idx? $color("#595959"): $color("#ffffff") }
            }
        })
    }
    $ui.push({
        type: "scroll",
        props: {
            title: "进阶设置"
        },
        views: [{
            type: "gallery",
            props: {
                id: "inputViews",
                items: inputViewData,
                interval: 0
            },
            layout: (make, view) => {
                make.height.equalTo(view.super).dividedBy(2)
                make.width.equalTo(view.super)
            }
        }, {
            type: "matrix",
            props: {
                columns: 2,
                id: "settingsControl",
                itemHeight: 40,
                bgcolor: $color("#ffffff"),
                spacing: 5,
                data: genControlBnts(0),
                template: [{
                    type: "label",
                    props: {
                        id: "title",
                        align: $align.center
                    },
                    layout: $layout.fill
                }]
            },
            layout: (make, view) => {
                make.height.equalTo(100)
                make.centerX.equalTo(view.super)
                make.width.equalTo(view.super).offset(-30)
                make.top.equalTo(view.prev.bottom).offset(10)
            },
            events: {
                didSelect: (sender, indexPath, data) => {
                    let idx = indexPath.row
                    $("settingsControl").data = genControlBnts(idx)
                    $("inputViews").page = idx
                }
            }
        }, {
            type: "label",
            props: {
                text: "上述设置如果出错，清空保存一次即可恢复",
                font: $font(12),
                textColor: $color("#595959"),
                align: $align.center
            },
            layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(00)
                make.width.equalTo(view.super)
                make.height.equalTo(30)
                make.centerX.equalTo(view.super)
            }
        }, {
            type: "button",
            props: {
                title: "赏杯咖啡以示鼓励",
                bgcolor: $color("#e6b800")
            },
            layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(20)
                make.width.equalTo(view.super).offset(-20)
                make.centerX.equalTo(view.super)
                make.height.equalTo(40)
            },
            events: {
                tapped: sender => {
                    $quicklook.open({
                        type: "jpg",
                        list: [$file.read("assets/thankyou2.jpg"), $file.read("assets/thankyou.jpg")]
                    })
                }
            }
        }]
    })
}

function addListener() {
    $app.listen({
        ready: function () {
            let file = JSON.parse($file.read(FILE).string)
            if (file && file.workspace) {
                let workspace = file.workspace
                $("fileName").text = workspace.fileName
                console.log(workspace.serverData)
                $("serverEditor").data = workspace.serverData.map(i => {
                    i.proxyName.bgcolor = i.proxyName.bgcolor ? selectedColor : defaultColor
                    return i
                })
                let usualSettingsData = workspace.usualData
                let nd = $("usualSettings").data.map(item => {
                    let sd = usualSettingsData.find(i => i.title.text == item.title.text)
                    if (sd) {
                        item.title.bgcolor = sd.title.bgcolor ? tintColor : defaultColor
                        item.title.textColor = sd.title.textColor ? defaultColor : blackColor
                    }
                    return item
                })
                $("usualSettings").data = nd
            }
        }
    })
}

function saveWorkspace() {
    let workspace = {
        fileName: $("fileName").text,
        serverData: $("serverEditor").data.map(i => {
            // 如果节点选上，则color为true
            i.proxyName.bgcolor = cu.isEqual(selectedColor, i.proxyName.bgcolor)
            return i
        }),
        usualData: $("usualSettings").data.map(i => {
            i.title.bgcolor = cu.isEqual(tintColor, i.title.bgcolor)
            i.title.textColor = cu.isEqual(defaultColor, i.title.textColor)
            return i
        })
    }
    let file = JSON.parse($file.read(FILE).string)
    file.workspace = workspace
    $file.write({
        data: $data({ string: JSON.stringify(file) }),
        path: FILE
    })
}


function setDefaultSettings() {
    let previewData = JSON.parse($file.read(FILE).string)
    for (let idx in settingKeys) {
        if (!(settingKeys[idx] in previewData) || previewData[settingKeys[idx]] == "") {
            let defaultValue = $file.read(`defaultConf/${settingKeys[idx]}`).string
            previewData[settingKeys[idx]] = defaultValue
        }
    }
    $file.write({
        data: $data({ "string": JSON.stringify(previewData) }),
        path: FILE
    })
}

module.exports = {
    renderUI: renderUI,
    addListener: addListener
}