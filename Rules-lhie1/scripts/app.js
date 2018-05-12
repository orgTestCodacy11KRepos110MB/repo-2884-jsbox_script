const proxyUtil = require('scripts/proxyUitl')
const updateUtil = require('scripts/updateUtil')
const su = require('scripts/sizeUtil')
const cu = require('scripts/colorUtil')
const videoReg = require('scripts/videoReg')
const ruleUpdateUtil = require('scripts/ruleUpdateUtil')

const FILE = 'data.js'

const settingKeys = ['generalSettings', 'proxyGroupSettings', 'customSettings', 'hostSettings', 'urlrewriteSettings', 'headerrewriteSettings', 'ssidSettings', 'hostnameSettings', 'mitmSettings']

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

const selectedColor = $color("#c1dcf0")
const defaultColor = $color("#ffffff")
const tintColor = $color("#ff6666")
const blackColor = $color("#000000")

function renderUI() {
    $ui.render({
        props: {
            title: "Surge3规则生成"
        },
        views: [{
            type: "scroll",
            props: {
                id: "mainView"
            },
            layout: $layout.fill,
            events: {
                // willEndDragging: (sender, velocity) => {
                //     let vy = velocity.runtimeValue().invoke("CGPointValue").y
                //     $("serverEditor").updateLayout((make, view) => {
                //         make.height.equalTo(screenHeight - (vy >= 0 ? 380 : 330))
                //     })
                // }
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
                    make.height.equalTo(40)
                    make.left.equalTo($("fileName").right).offset(10)
                    make.top.right.equalTo(10)
                },
                events: {
                    tapped: sender => {
                        importMenu({
                            handler: (res, name) => {
                                if (!res) {
                                    $ui.alert("没有检测到节点信息")
                                }
                                let listData = $("serverEditor").data || []
                                let section = { title: name, rows: [] }
                                for (let idx in res) {
                                    if (res[idx].split("=")[1].trim() == 'direct') {
                                        // 过滤直连
                                        continue
                                    }
                                    section.rows.push({
                                        proxyName: { text: res[idx].split('=')[0].trim(), bgcolor: defaultColor },
                                        proxyLink: res[idx]
                                    })
                                }
                                listData.push(section)
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
                    columns: 4,
                    // radius: 5,
                    itemHeight: 40,
                    bgcolor: $color("#f0f5f5"),
                    data: [{
                        title: { text: '节点倒序' }
                    }, {
                        title: { text: '批量Auto' }
                    }, {
                        title: { text: '特殊代理' }
                    }, {
                        title: { text: '删除分组' }
                    }],
                    template: [{
                        type: "label",
                        props: {
                            id: "title",
                            align: $align.center,
                            font: $font(14)
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
                            reverseServerGroup()
                        } else if (indexPath.item == 1) {
                            autoServerGroup()
                        } else if (indexPath.item == 3) {
                            deleteServerGroup()
                        } else {
                            $ui.menu({
                                items: ['🚀 Direct', '查看设置', '清除设置'],
                                handler: function (title, idx) {
                                    if (idx === 0) {
                                        $ui.menu({
                                            items: Object.keys(videoReg),
                                            handler: function (title, idx) {
                                                let proxyName = '🚀 Direct'
                                                let videoProxy = $("serverEditor").info
                                                videoProxy[title] = proxyName
                                                $("serverEditor").info = videoProxy
                                                saveWorkspace()
                                            }
                                        })
                                    } else if (idx === 2) {
                                        $("serverEditor").info = {}
                                        saveWorkspace()
                                    } else {
                                        let videoProxy = $("serverEditor").info
                                        let output = []
                                        for (let k in videoProxy) {
                                            output.push(`${k} - ${videoProxy[k]}`)
                                        }
                                        $ui.alert(output.length > 0 ? output.join('\n') : "无设置特殊代理")
                                    }
                                }
                            })
                        }
                    }
                }
            }, {
                type: "list",
                props: {
                    id: "serverEditor",
                    data: [],
                    separatorHidden: true,
                    reorder: true,
                    actions: [{
                        title: "delete",
                        handler: (sender, indexPath) => {
                            saveWorkspace()
                        }
                    }, {
                        title: "重命名",
                        handler: (sender, indexPath) => {
                            $ui.menu({
                                items: ["节点重命名", "组别重命名"],
                                handler: function (title, idx) {
                                    if (idx === 0) {
                                        let titleText = sender.object(indexPath).proxyName.text
                                        $input.text({
                                            type: $kbType.default,
                                            placeholder: "请输入节点名",
                                            text: titleText == '无节点名称' ? "" : titleText,
                                            handler: function (text) {
                                                let obj = sender.object(indexPath)
                                                obj.proxyName.text = text
                                                let proxyURLNoName = obj.proxyLink.split("=")
                                                proxyURLNoName.shift()
                                                obj.proxyLink = `${text} =${proxyURLNoName.join("=")}`
                                                listReplace(sender, indexPath, obj)
                                                saveWorkspace()
                                            }
                                        })
                                    } else {
                                        let od = sender.data
                                        $input.text({
                                            type: $kbType.default,
                                            placeholder: "请输入组别名称",
                                            text: od[indexPath.section].title,
                                            handler: function (text) {
                                                od[indexPath.section].title = text
                                                sender.data = od
                                                saveWorkspace()
                                            }
                                        })
                                    }
                                }
                            })

                        }
                    }, {
                        title: "特殊代理",
                        handler: (sender, indexPath) => {
                            let proxyName = sender.object(indexPath).proxyName.text
                            $ui.menu({
                                items: Object.keys(videoReg),
                                handler: function (title, idx) {
                                    let videoProxy = sender.info
                                    videoProxy[title] = proxyName
                                    sender.info = videoProxy
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
                        let uiData = sender.data
                        uiData[indexPath.section].rows[indexPath.row] = data
                        sender.data = uiData
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
                        title: { text: '导出配置', bgcolor: defaultColor, textColor: blackColor }
                    }],
                    template: [{
                        type: "label",
                        props: {
                            id: "title",
                            align: $align.center,
                            font: $font(16),
                            radius: 5,
                            borderColor: tintColor,
                            borderWidth: 0.3,
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
                make.width.equalTo((screenWidth / 2 - 15) * 0.686 - 10)
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
                id: "aboutBtn",
                title: "关于",
                bgcolor: $color("#808080")
            },
            layout: (make, view) => {
                make.height.equalTo(40)
                make.width.equalTo((screenWidth / 2 - 15) * 0.314 + 5)
                make.left.equalTo($("advanceBtn").right).offset(5)
                make.top.equalTo($("usualSettings").bottom).offset(5)
            },
            events: {
                tapped: sender => {
                    renderAboutUI()
                }
            }
        }, {
            type: "button",
            props: {
                id: "genBtn",
                title: "生成配置"
            },
            layout: (make, view) => {
                make.width.equalTo((screenWidth - 10) * 0.5 - 5)
                // make.centerX.equalTo(view.super)
                make.height.equalTo(40)
                make.right.equalTo(view.super).offset(-10)
                make.top.equalTo($("usualSettings").bottom).offset(5)
            },
            events: {
                tapped: sender => {
                    makeConf({
                        onStart: () => {
                            $("progressView").hidden = false
                            $ui.animate({
                                duration: 0.2,
                                animation: function () {
                                    $("progressView").alpha = 1
                                }
                            })
                        },
                        onProgress: p => {
                            $("progressBar").value = p
                        },
                        onDone: res => {
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
                            exportConf(res.fileName, res.fileData, res.actionSheet, () => {
                                $http.stopServer()
                            })
                            $app.listen({
                                resume: function () {
                                    $http.stopServer()
                                }
                            })
                        },
                        onError: res => {
                            $("progressView").value = 0
                            $("progressView").hidden = true
                        }
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

function listReplace(sender, indexPath, obj) {
    let oldData = sender.data
    if (indexPath.section != null) {
        oldData[indexPath.section].rows[indexPath.row] = obj
    } else {
        oldData[indexPath.row] = obj
    }
    sender.data = oldData
}

function getPrototype(done) {
    return new Promise((resolve, reject) => {
        $http.get({
            url: "https://raw.githubusercontent.com/lhie1/Rules/master/Surge/Prototype.conf",
            handler: function (resp) {
                if (done) done()
                resolve(resp.data)
            }
        })
    })
}

function getAutoRules(url, done) {
    return new Promise((resolve, reject) => {
        $http.get({
            url: url,
            handler: function (resp) {
                if (done) done()
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
                console.log([url, idx])
                linkHandler(url, params)
            }
        }
    })
}

function linkHandler(url, params) {
    let servers = {
        shadowsocks: [],
        surge: [],
        online: [],
        ignore: []
    }

    let urls = url.split(/[\r\n]+/g).map(i => i.trim()).filter(i => i !== '')
    urls.forEach(item => {
        if (/^ss:\/\//.test(item)) {
            servers.shadowsocks.push(item)
        } else if (/^https?:\/\//.test(item)) {
            servers.online.push(item)
        } else if (/[\S\s]+=[\s]*(custom|http|https|socks5|socks5-tls),/.test(item)) {
            servers.surge.push(item)
        } else {
            servers.ignore.push(item)
        }
    })

    for (let k in servers) {
        if (servers[k].length === 0) {
            continue
        }
        if (k === 'shadowsocks') {
            proxyUtil.proxyFromURL({
                ssURL: servers[k],
                handler: res => {
                    params.handler(res.servers, res.sstag)
                    saveURL(servers[k].join('\n'), res.sstag)
                }
            })
        } else if (k === 'surge') {
            let urls = servers[k].map(i => i.replace(/,[\s]*udp-relay=true/, ''))
            let result = []
            for (let idx in urls) {
                result[idx] = urls[idx]
            }
            params.handler(result, urls.length > 1 ? `批量Surge链接（${urls.length}）` : result[0].split('=')[0].trim())
            saveURL(urls.join('\n'), urls.length > 1 ? `批量Surge链接（${urls.length}）` : result[0].split('=')[0].trim())
        } else if (k === 'online') {
            $ui.loading(true)
            proxyUtil.proxyFromConf({
                urls: servers[k],
                handler: res => {
                    params.handler(res.servers, res.filename)
                    $ui.loading(false)
                    saveURL(res.url, res.filename)
                }
            })
        } else {
            $ui.alert('剪贴板存在无法识别的行：\n\n' + servers.ignore.join('\n') + '\n\n以上行将被丢弃！')
        }
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
    let genControlBnts = function (idx) {
        let titleTexts = ['常规', '代理分组', '代理规则', '本地DNS映射', 'URL重定向', 'Header修改', 'SSID', '主机名', '配置根证书']
        const sbgc = $color("#ffda40")
        const stc = $color("#034769")
        const dbgc = $color("#63add0")
        const dtc = $color("#ffffff")
        return titleTexts.map((item, i) => {
            return {
                title: { text: item, bgcolor: i === idx ? sbgc : dbgc, radius: 5, color: i == idx ? stc : dtc }
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
            },
            events: {
                changed: sender => {
                    let idx = sender.page
                    $("settingsControl").data = genControlBnts(idx)
                }
            }
        }, {
            type: "matrix",
            props: {
                columns: 3,
                id: "settingsControl",
                itemHeight: 40,
                bgcolor: $color("#ffffff"),
                spacing: 3,
                data: genControlBnts(0),
                template: [{
                    type: "label",
                    props: {
                        id: "title",
                        align: $align.center,
                        font: $font(14)
                    },
                    layout: $layout.fill
                }]
            },
            layout: (make, view) => {
                make.height.equalTo(130)
                make.centerX.equalTo(view.super)
                make.width.equalTo(view.super).offset(0)
                make.top.equalTo(view.prev.bottom).offset(5)
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
                text: "上述设置点击完成生效，清空保存一次恢复默认",
                font: $font(12),
                textColor: $color("#595959"),
                align: $align.center
            },
            layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(0)
                make.width.equalTo(view.super)
                make.height.equalTo(30)
                make.centerX.equalTo(view.super)
            }
        }, {
            type: "button",
            props: {
                title: '还原全部进阶设置',
                bgcolor: $color("#ff6840")
            },
            layout: (make, view) => {
                make.width.equalTo(view.super).offset(-40)
                make.centerX.equalTo(view.super)
                make.top.equalTo(view.prev.bottom).offset(10)
                make.height.equalTo(40)
            },
            events: {
                tapped: sender => {
                    $ui.alert({
                        title: "提示",
                        message: "是否还原配置，还原后无法恢复",
                        actions: [{
                            title: 'Cancel',
                            handler: () => { }
                        }, {
                            title: 'OK',
                            handler: () => {
                                let previewData = JSON.parse($file.read(FILE).string)
                                for (let idx in settingKeys) {
                                    let defaultValue = $file.read(`defaultConf/${settingKeys[idx]}`).string
                                    previewData[settingKeys[idx]] = defaultValue
                                }
                                $file.write({
                                    data: $data({ "string": JSON.stringify(previewData) }),
                                    path: FILE
                                })
                                $ui.pop()
                            }
                        }]
                    })
                }
            }
        }]
    })
}

function renderAboutUI() {
    let previewMD = function (title, filePath) {
        $ui.push({
            props: {
                title: title
            },
            views: [{
                type: "markdown",
                props: {
                    id: "",
                    content: $file.read(filePath).string
                },
                layout: $layout.fill
            }]
        })
    }

    $ui.push({
        props: {
            title: "关于"
        },
        views: [{
            type: "view",
            props: {
                id: "mainAboutView"
            },
            layout: $layout.fill,
            views: [{
                type: "label",
                props: {
                    text: "文档说明",
                    font: $font(13),
                    textColor: $color("#505050")
                },
                layout: (make, view) => {
                    make.top.equalTo(view.super).offset(10)
                    make.height.equalTo(30)
                    make.left.equalTo(15)
                }
            }, {
                type: "list",
                props: {
                    data: ["🗂  脚本简介", "📃  更新日志", "🖥  论坛导航"]
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super)
                    make.top.equalTo(view.prev.bottom).offset(0)
                    make.height.equalTo(135)
                },
                events: {
                    didSelect: (sender, indexPath, data) => {
                        if (indexPath.row == 0) {
                            previewMD(data, 'docs.md')
                        } else if (indexPath.row == 1) {
                            previewMD(data, 'updateLog.md')
                        } else {
                            $app.openURL("https://jsboxbbs.com/d/290-lhie1")
                        }
                    }
                }
            }, {
                type: "label",
                props: {
                    text: "致谢捐献",
                    font: $font(13),
                    textColor: $color("#505050")
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(20)
                    make.height.equalTo(30)
                    make.left.equalTo(15)
                }
            }, {
                type: "list",
                props: {
                    data: ["🙏  捐献打赏名单", "👍  赏杯咖啡支持作者"]
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super)
                    make.top.equalTo(view.prev.bottom).offset(0)
                    make.height.equalTo(90)
                },
                events: {
                    didSelect: (sender, indexPath, data) => {
                        if (indexPath.row == 0) {
                            previewMD(data, 'donate.md')
                        } else {
                            $ui.menu({
                                items: ["支付宝", "微信"],
                                handler: function (title, idx) {
                                    if (idx == 0) {
                                        $app.openURL($qrcode.decode($file.read("assets/thankyou2.jpg").image))
                                    } else {
                                        $quicklook.open({
                                            image: $file.read("assets/thankyou.jpg").image
                                        })
                                    }
                                }
                            })
                        }
                    }
                }
            }, {
                type: "label",
                props: {
                    text: "反馈联系",
                    font: $font(13),
                    textColor: $color("#505050")
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(20)
                    make.height.equalTo(30)
                    make.left.equalTo(15)
                }
            }, {
                type: "list",
                props: {
                    data: ["📠  Telegram", "💡  GitHub"]
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super)
                    make.top.equalTo(view.prev.bottom).offset(0)
                    make.height.equalTo(90)
                },
                events: {
                    didSelect: (sender, indexPath, data) => {
                        if (indexPath.row == 0) {
                            $app.openURL("https://t.me/Fndroid")
                        } else {
                            $app.openURL("https://github.com/Fndroid/jsbox_script/tree/master/Rules-lhie1")
                        }
                    }
                }
            }, {
                type: "label",
                props: {
                    text: "版本号：" + updateUtil.getCurVersion(),
                    font: $font(13),
                    textColor: $color("#505050")
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(20)
                    make.height.equalTo(30)
                    make.centerX.equalTo(view.super)
                }
            }]
        }]
    })
}

function deleteServerGroup() {
    let serverData = $("serverEditor").data
    let sections = serverData.map(i => i.title)
    if (sections.length === 1) {
        $("serverEditor").data = []
        saveWorkspace()
        return
    }
    $ui.menu({
        items: sections.concat(['全部删除']),
        handler: function (title, idx) {
            if (idx === sections.length) {
                $("serverEditor").data = []
            } else {
                serverData.splice(idx, 1)
                $("serverEditor").data = serverData
            }
            saveWorkspace()
        }
    })
}

function reverseServerGroup() {
    let serverData = $("serverEditor").data
    let sections = serverData.map(i => i.title)
    if (sections.length === 1) {
        serverData[0].rows.reverse()
        $("serverEditor").data = serverData
        saveWorkspace()
        return
    }
    $ui.menu({
        items: sections.concat(['组别倒序']),
        handler: function (title, idx) {
            if (idx === sections.length) {
                $("serverEditor").data = serverData.reverse()
            } else {
                serverData[idx].rows.reverse()
                $("serverEditor").data = serverData
            }
            saveWorkspace()
        }
    })
}

function autoServerGroup() {
    let serverData = $("serverEditor").data
    let sections = serverData.map(i => i.title)
    if (sections.length === 1) {
        let allSelected = serverData[0].rows.every(item => cu.isEqual(item.proxyName.bgcolor, selectedColor))
        serverData[0].rows.map(item => {
            item.proxyName.bgcolor = allSelected ? defaultColor : selectedColor
            return item
        })
        $("serverEditor").data = serverData
        saveWorkspace()
        return
    }
    $ui.menu({
        items: sections.concat(['全部Auto']),
        handler: function (title, idx) {
            if (idx === sections.length) {
                let flatData = serverData.reduce((all, cur) => {
                    return { rows: all.rows.concat(cur.rows) }
                }).rows
                let needColor = defaultColor
                if (!flatData.every(i => cu.isEqual(i.proxyName.bgcolor, selectedColor))) {
                    needColor = selectedColor
                }
                serverData.map(sec => {
                    sec.rows.map(item => {
                        item.proxyName.bgcolor = needColor
                        return item
                    })
                    return sec
                })
            } else {
                let sectionData = serverData[idx]
                let needColor = defaultColor
                if (!sectionData.rows.every(i => cu.isEqual(i.proxyName.bgcolor, selectedColor))) {
                    needColor = selectedColor
                }
                sectionData.rows.map(item => {
                    item.proxyName.bgcolor = needColor
                    return item
                })
            }
            $("serverEditor").data = serverData
            saveWorkspace()
        }
    })
}

function setUpWorkspace() {
    $app.listen({
        ready: function () {
            let file = JSON.parse($file.read(FILE).string)
            if (file && file.workspace) {
                let workspace = file.workspace
                console.log(file)
                $("fileName").text = workspace.fileName
                $("serverEditor").data = workspace.serverData.map(section => {
                    section.rows.map(item => {
                        item.proxyName.bgcolor = item.proxyName.bgcolor ? selectedColor : defaultColor
                        return item
                    })
                    return section
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
                // videoProxy = workspace.videoProxy
                $("serverEditor").info = workspace.videoProxy || {}
            }
        }
    })
}

function saveWorkspace() {
    let workspace = {
        fileName: $("fileName").text,
        serverData: $("serverEditor").data.map(section => {
            // 如果节点选上，则color为true
            section.rows.map(item => {
                item.proxyName.bgcolor = cu.isEqual(selectedColor, item.proxyName.bgcolor)
                return item
            })
            return section
        }),
        usualData: $("usualSettings").data.map(i => {
            i.title.bgcolor = cu.isEqual(tintColor, i.title.bgcolor)
            i.title.textColor = cu.isEqual(defaultColor, i.title.textColor)
            return i
        }),
        videoProxy: $("serverEditor").info || {}
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

function autoGen() {
    let settings = JSON.parse($file.read(FILE).string)
    console.log(settings)
    $ui.render({
        props: {
            title: ""
        },
        layout: $layout.fill,
        views: [{
            type: "blur",
            props: {
                id: "progressView",
                style: 1
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
    $app.listen({
        ready: function () {
            makeConf({
                onStart: () => {
                    console.log('start')
                },
                onProgress: p => {
                    $("progressBar").value = p
                },
                onDone: res => {
                    exportConf(res.fileName, res.fileData, res.actionSheet, () => {
                        $http.stopServer()
                        $app.close()
                    })
                    $app.listen({
                        resume: function () {
                            $http.stopServer()
                            $app.close()
                        }
                    })
                },
                onError: res => {
                    $ui.alert("无法生成配置文件，可能是规则仓库发生变化或网络出现问题")
                }
            })
        },
        exit: function () {

        }
    })
}

function makeConf(params) {
    'onStart' in params && params.onStart()
    try {
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
        let advanceSettings = JSON.parse($file.read(FILE).string)
        let workspace = advanceSettings.workspace
        let usualData = workspace.usualData

        let usualValue = function (key) {
            return usualData.find(i => i.title.text == key) ? usualData.find(i => i.title.text == key).title.bgcolor : false
        }

        let ads = usualValue('去广告')
        let isMitm = usualValue('开启MITM')
        let isTF = usualValue('UDP')
        let isActionSheet = usualValue('导出配置')

        let serverEditorData = workspace.serverData
        let flatServerData = serverEditorData.reduce((all, cur) => {
            return {
                rows: all.rows.concat(cur.rows)
            }
        }).rows
        let autoGroup = flatServerData.filter(i => i.proxyName.bgcolor).map(i => i.proxyName.text).join(',') || 'DIRECT'
        let proxies = flatServerData.map(i => {
            return i.proxyLink + (isTF ? ',udp-relay=true' : '')
        }).join('\n')
        let proxyHeaders = flatServerData.map(i => i.proxyName.text).join(', ')
        let rules = ''
        let prototype = ''
        let testFlight = ''
        let host = ''
        let urlRewrite = ''
        let urlReject = ''
        let headerRewrite = ''
        let hostName = ''
        let mitm = ''

        let pgs = 0

        let onPgs = function () {
            pgs += 0.1
            'onProgress' in params && params.onProgress(pgs)
        }

        let emptyPromise = function (done) {
            if (done) done()
            return Promise.resolve('')
        }

        let promiseArray = [
            getPrototype(onPgs), // 0
            getAutoRules(pu.apple, onPgs), // 1
            getAutoRules(pu.reject, onPgs),  // 2
            getAutoRules(pu.proxy, onPgs), // 3
            getAutoRules(pu.direct, onPgs), // 4
            getAutoRules(pu.host, onPgs), // 5
            getAutoRules(pu.urlrewrite, onPgs), // 6
            getAutoRules(pu.urlreject, onPgs), // 7
            getAutoRules(pu.headerrewrite, onPgs), // 8
            getAutoRules(pu.hostname, onPgs) // 9
        ]

        if (!ads) {
            promiseArray[2] = emptyPromise(onPgs)
            promiseArray[7] = emptyPromise(onPgs)
        }

        Promise.all(promiseArray).then(v => {
            console.log(v)
            prototype = v[0]
            rules += `\n${v[1]}\n${v[2].split("REJECT").join("REJECT-TINYGIF")}\n${v[3]}\n${v[4]}\n`
            host = v[5]
            urlRewrite += v[6]
            urlReject += v[7]
            headerRewrite = v[8]
            hostName = v[9].split('\n')

            let seperateLines = function (content) {
                return {
                    add: content.split('\n').filter(i => !i.startsWith('-')).map(i => i.trim()),
                    delete: content.split("\n").filter(i => i.startsWith('-')).map(i => i.replace('-', '').trim())
                }
            }

            let prettyInsert = function (lines) {
                return '\n\n' + lines.join('\n') + '\n\n'
            }

            // 配置代理分组
            if (advanceSettings.proxyGroupSettings) {
                prototype = prototype.replace(/\[Proxy Group\][\s\S]+\[Rule\]/, advanceSettings.proxyGroupSettings + '\n\n[Rule]')
            }
            // 配置常规设置
            if (advanceSettings.generalSettings) {
                prototype = prototype.replace(/\[General\][\s\S]+\[Proxy\]/, advanceSettings.generalSettings + '\n\n[Proxy]')
            }
            // 配置自定义规则
            let customRules = seperateLines(advanceSettings.customSettings)
            customRules.delete.forEach(i => rules = rules.replace(i, ''))
            // 配置本地DNS映射
            let userHost = seperateLines(advanceSettings.hostSettings)
            userHost.delete.forEach(i => host = host.replace(i, ''))
            // 配置URL重定向
            let userUrl = seperateLines(advanceSettings.urlrewriteSettings)
            userUrl.delete.forEach(i => {
                urlRewrite = urlRewrite.replace(i, '')
                urlReject = urlReject.replace(i, '')
            })
            // 配置Header修改
            let userHeader = seperateLines(advanceSettings.headerrewriteSettings)
            userHeader.delete.forEach(i => headerRewrite = headerRewrite.replace(i, ''))
            // 配置SSID
            let userSSID = advanceSettings.ssidSettings
            // 配置MITM的Hostname
            let userHostname = seperateLines(advanceSettings.hostnameSettings)
            userHostname.delete.forEach(i => {
                if (hostName.indexOf(i) >= 0) {
                    hostName.splice(hostName.indexOf(i), 1)
                }
            })

            // 视频代理处理
            let videoProxy = workspace.videoProxy
            for (let videoType in videoProxy) {
                let proxyName = videoProxy[videoType]
                rules.match(videoReg[videoType]).forEach(i => {
                    rules = rules.replace(i, i.replace('🍃 Proxy', proxyName))
                })
            }

            prototype = prototype.replace('# Custom', prettyInsert(customRules.add))
            prototype = prototype.replace('Proxys', proxies)
            prototype = prototype.replace(/Proxy Header/g, proxyHeaders)
            prototype = prototype.replace(/ProxyHeader/g, autoGroup)
            prototype = prototype.replace('# All Rules', rules)
            prototype = prototype.replace('# Host', host + prettyInsert(userHost.add))
            prototype = prototype.replace('# URL Rewrite', urlRewrite + prettyInsert(userUrl.add))
            prototype = prototype.replace('# URL REJECT', urlReject)
            prototype = prototype.replace('# SSID', userSSID)
            prototype = prototype.replace('# Header Rewrite', headerRewrite + prettyInsert(userHeader.add))
            prototype = prototype.replace('// Hostname', 'hostname = ' + hostName.concat(userHostname.add.filter(i => i != '')).join(', '))

            if (isMitm) {
                prototype = prototype.replace('# MITM', advanceSettings.mitmSettings)
            } else {
                prototype = prototype.replace('# MITM', "")
            }

            let fn = (workspace.fileName || 'lhie1') + '.conf'

            if ('onDone' in params) {
                ruleUpdateUtil.getGitHubFilesSha({
                    handler: sha => {
                        if (sha) {
                            ruleUpdateUtil.setFilesSha(sha)
                        } else {
                            console.log('sha 获取失败')
                        }
                    }
                })
                params.onDone({
                    actionSheet: isActionSheet,
                    fileName: fn,
                    fileData: prototype
                })
            }
        }).catch(e => {
            console.error(e)
        })
    } catch (e) {
        'onError' in params && params.onError(e)
    }
}

function exportConf(fileName, fileData, actionSheet, actionSheetCancel) {
    let fnReg = /^[\x21-\x2A\x2C-\x2E\x30-\x3B\x3D\x3F-\x5B\x5D\x5F\x61-\x7B\x7D-\x7E]+$/
    if (actionSheet || !fnReg.test(fileName)) {
        $share.sheet({
            items: [fileName, $data({ "string": fileData })],
            handler: success => {
                if (!success && actionSheetCancel) {
                    actionSheetCancel()
                }
            }
        })
    } else {
        if (!$file.exists("confs")) {
            $file.mkdir("confs")
        } else {
            $file.list('confs').forEach(i => $file.delete('confs/' + i))
        }
        $file.write({
            data: $data({ "string": fileData }),
            path: `confs/${fileName}`
        })
        $http.startServer({
            path: "confs/",
            handler: res => {
                let serverUrl = `http://127.0.0.1:${res.port}/`
                $http.get({
                    url: serverUrl + "list?path=",
                    handler: function (resp) {
                        if (resp.response.statusCode == 200) {
                            let surgeScheme = `surge3:///install-config?url=${encodeURIComponent(serverUrl + "download?path=" + fileName)}`
                            $app.openURL(surgeScheme)
                        } else {
                            $ui.alert("内置服务器启动失败，请重试")
                        }
                    }
                })
            }
        })
    }
}

module.exports = {
    renderUI: renderUI,
    setUpWorkspace: setUpWorkspace,
    autoGen: autoGen
}