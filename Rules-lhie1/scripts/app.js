const proxyUtil = require('scripts/proxyUitl')
const updateUtil = require('scripts/updateUtil')
const su = require('scripts/sizeUtil')
const cu = require('scripts/colorUtil')
const videoReg = require('scripts/videoReg')
const ruleUpdateUtil = require('scripts/ruleUpdateUtil')
const customViews = require('scripts/customViews')

const FILE = 'data.js'
const PROXY_HEADER = 'ProxyHeader'

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
            title: "Surge规则生成"
        },
        views: [{
            type: "view",
            props: {
                id: "mainView"
            },
            layout: $layout.fill,
            views: [{
                type: "input",
                props: {
                    id: "fileName",
                    text: '',
                    placeholder: "配置名（lhie1)"
                },
                layout: (make, view) => {
                    make.width.equalTo(screenWidth / 2 - 15)
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
                    type: $btnType.contactAdd,
                    id: "serverURL",
                    title: " 添加、更新节点"
                },
                layout: (make, view) => {
                    make.width.equalTo(screenWidth / 2 - 15)
                    make.height.equalTo(40)
                    make.right.equalTo(-10)
                    make.top.equalTo(10)
                },
                events: {
                    tapped: sender => {
                        importMenu({
                            handler: (res, name, url) => {
                                // 如果是托管，url不为undefined
                                console.log([res, name, url])
                                if (!res) {
                                    $ui.alert("没有检测到节点信息")
                                }
                                let listData = $("serverEditor").data || []
                                let existsSec = listData.find(item => item.url === url)
                                let section = existsSec || { title: name, rows: [], url: url }
                                let selectedRows = []
                                if (existsSec) {
                                    selectedRows = section.rows.filter(i => cu.isEqual(i.proxyName.bgcolor, selectedColor)).map(i => i.proxyName.text)
                                }
                                console.error(selectedRows)
                                section.rows = []
                                for (let idx in res) {
                                    if (res[idx].split("=")[1].trim() == 'direct') {
                                        // 过滤直连
                                        continue
                                    }
                                    let selected = selectedRows.indexOf(res[idx].split('=')[0].trim()) > -1
                                    section.rows.push({
                                        proxyName: { text: res[idx].split('=')[0].trim(), bgcolor: selected ? selectedColor : defaultColor },
                                        proxyLink: res[idx]
                                    })
                                }
                                if (!existsSec) {
                                    listData.push(section)
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
                    columns: 4,
                    scrollEnabled: false,
                    itemHeight: 40,
                    bgcolor: $color("#f0f5f5"),
                    data: genControlItems(),
                    template: [{
                        type: "label",
                        props: {
                            id: "title",
                            align: $align.center,
                            font: $font(14),
                            autoFontSize: true
                        },
                        layout: $layout.fill
                    }],
                    info: {}
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
                            groupShortcut()
                        } else if (indexPath.item == 3) {
                            deleteServerGroup()
                        } else {
                            let groups = getProxyGroups();
                            const menuItems = groups.concat(['🚀 Direct', '查看设置', '清除设置'])
                            $ui.menu({
                                items: menuItems,
                                handler: function (mTitle, idx) {
                                    if (idx === menuItems.length - 1) {
                                        $("serverEditor").info = {}
                                        saveWorkspace()
                                    } else if (idx === menuItems.length - 2) {
                                        let videoProxy = $("serverEditor").info
                                        let output = []
                                        for (let k in videoProxy) {
                                            output.push(`${k} - ${videoProxy[k]}`)
                                        }
                                        $ui.alert(output.length > 0 ? output.join('\n') : "无设置特殊代理")
                                    } else {
                                        $ui.menu({
                                            items: Object.keys(videoReg),
                                            handler: function (title, idx) {
                                                let proxyName = mTitle
                                                let videoProxy = $("serverEditor").info
                                                videoProxy[title] = proxyName
                                                $("serverEditor").info = videoProxy
                                                saveWorkspace()
                                            }
                                        })
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
                        let isSelected = cu.isEqual(data.proxyName.bgcolor, selectedColor)
                        let controlInfo = $("serverControl").info
                        let currentGroup = controlInfo.currentProxyGroup
                        console.log(currentGroup)
                        let customProxyGroup = controlInfo.customProxyGroup || {}
                        if (isSelected) {
                            data.proxyName.bgcolor = defaultColor
                            customProxyGroup[currentGroup] = customProxyGroup[currentGroup].filter(i => i !== proxyName)
                        } else {
                            data.proxyName.bgcolor = selectedColor
                            customProxyGroup[currentGroup].push(proxyName)
                        }
                        let uiData = sender.data
                        uiData[indexPath.section].rows[indexPath.row] = data
                        sender.data = uiData
                        $("serverControl").info = controlInfo
                        saveWorkspace()
                    },
                    reorderFinished: data => {
                        $("serverEditor").data = data
                        saveWorkspace()
                    }
                }
            }, {
                type: "input",
                props: {
                    id: "serverSuffixEditor",
                    placeholder: ',udp-relay=true,tfo=true（节点后缀）',
                    text: '',
                    font: $font(18),
                    type: $kbType.ascii
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(10)
                    make.width.equalTo(view.prev)
                    make.height.equalTo(45)
                    make.centerX.equalTo(view.super)
                },
                events: {
                    returned: sender => {
                        $("serverSuffixEditor").blur()
                        saveWorkspace()
                    }
                }
            }, {
                type: "matrix",
                props: {
                    id: "usualSettings",
                    columns: 4,
                    itemHeight: 40,
                    spacing: 5,
                    scrollEnabled: false,
                    data: [{
                        title: { text: '去广告', bgcolor: defaultColor, textColor: blackColor }
                    }, {
                        title: { text: '开启MITM', bgcolor: defaultColor, textColor: blackColor }
                    }, {
                        title: { text: 'Surge2', bgcolor: defaultColor, textColor: blackColor }
                    },{
                        title: { text: '导出配置', bgcolor: defaultColor, textColor: blackColor }
                    }],
                    template: [{
                        type: "label",
                        props: {
                            id: "title",
                            align: $align.center,
                            font: $font(12),
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
                    make.height.equalTo(50)
                    make.top.equalTo($("serverSuffixEditor").bottom).offset(5)
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
            }]
        }, {
            type: "button",
            props: {
                id: "advanceBtn",
                title: "进阶设置",
                bgcolor: $color("#808080")
            },
            layout: (make, view) => {
                make.width.equalTo((screenWidth / 2 - 15) * 0.686 - 10)
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

function genControlItems() {
    let currentProxyGroup = PROXY_HEADER
    try {
        currentProxyGroup = $("serverControl").info.currentProxyGroup
    } catch(e) {}
    return [{
        title: { text: '节点倒序' }
    }, {
        title: { text: currentProxyGroup }
    }, {
        title: { text: '特殊代理' }
    }, {
        title: { text: '删除分组' }
    }]
}

function getProxyGroups() {
    let fileData = JSON.parse($file.read(FILE).string)
    let proxyGroupSettings = fileData.proxyGroupSettings
    let groups = proxyGroupSettings.split(/[\n\r]/).filter(i => /^[\s\S]+=[\s\S]+/.test(i)).map(i => i.split('=')[0].trim())
    return groups
}

function groupShortcut() {
    let controlInfo = $("serverControl").info
    let currentProxyGroup = controlInfo.currentProxyGroup || PROXY_HEADER
    let customProxyGroup = controlInfo.customProxyGroup || {}
    let menuItems = Object.keys(customProxyGroup).concat(['新增占位符']).filter(i => i !== currentProxyGroup)
    $ui.menu({
        items: menuItems,
        handler: function (title, idx) {
            if (idx === menuItems.length - 1) {
                $input.text({
                    type: $kbType.default,
                    placeholder: "占位符，在进阶设置中使用",
                    handler: function (text) {
                        if ([PROXY_HEADER, 'Proxy Header'].indexOf(text) > -1) {
                            $ui.error("占位符名称冲突")
                            return
                        }
                        customProxyGroup[text] = []
                        $("serverControl").info = controlInfo
                        saveWorkspace()
                        $ui.toast(`切换到占位符：${text}`)
                        switchToGroup(text)
                    }
                })
            } else {
                $ui.alert({
                    title: "请选择",
                    message: "占位符代表一组节点名称，配合进阶设置可以进行自定义策略组",
                    actions: [{
                        title: '编辑',
                        handler: () => {
                            switchToGroup(title)
                        }
                    }, {
                        title: '复制',
                        handler: () => {
                            $clipboard.text = title
                            $ui.toast("已复制到剪贴板")
                        }
                    }, {
                        title: '删除',
                        handler: () => {
                            if ([PROXY_HEADER, 'Proxy Header'].indexOf(title) > -1) {
                                $ui.error("此占位符无法删除")
                                return
                            }
                            delete customProxyGroup[title]
                            $("serverControl").info = controlInfo
                            saveWorkspace()
                            $ui.toast(`已删除占位符：${title}`)
                        }
                    }, {
                        title: '取消'
                    }]
                })
            }
        }
    })

    function switchToGroup(title) {
        let group = customProxyGroup[title];
        // 保存当前编辑策略组
        controlInfo.currentProxyGroup = title;
        $("serverControl").info = controlInfo;
        // 恢复选中的策略组UI
        let listData = $("serverEditor").data || [];
        listData = listData.map(section => {
            section.rows = section.rows.map(item => {
                item.proxyName.bgcolor = group.indexOf(item.proxyName.text) > -1 ? selectedColor : defaultColor;
                return item;
            });
            return section;
        });
        $("serverEditor").data = listData;
        $("serverControl").data = genControlItems()
    }
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
    let staticItems = ['剪贴板导入', '二维码导入', '更新列表节点']
    $ui.menu({
        items: staticItems,
        handler: function (title, idx) {
            if (title === staticItems[0]) {
                let clipText = $clipboard.text
                linkHandler(clipText, params)
            } else if (title === staticItems[1]) {
                $qrcode.scan({
                    handler(string) {
                        linkHandler(string, params)
                    }
                })
            } else if (title === staticItems[2]) {
                let listSections = $("serverEditor").data
                linkHandler(listSections.map(i => i.url).join('\n'), params)
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
        } else if (/[\S\s]+=[\s]*(custom|http|https|socks5|socks5-tls)/.test(item)) {
            servers.surge.push(item)
        } else {
            servers.ignore.push(item)
        }
    })

    console.log(servers)

    for (let k in servers) {
        if (servers[k].length === 0) {
            continue
        }
        if (k === 'shadowsocks') {
            console.log(servers[k])
            proxyUtil.proxyFromURL({
                ssURL: servers[k],
                handler: res => {
                    params.handler(res.servers, res.sstag, servers[k].join('\n'))
                }
            })
        } else if (k === 'surge') {
            let urls = servers[k].map(i => i.replace(/,[\s]*udp-relay=true/, ''))
            let result = []
            for (let idx in urls) {
                result[idx] = urls[idx]
            }
            $delay(0.3, function () {
                params.handler(result, urls.length > 1 ? `批量Surge链接（${urls.length}）` : result[0].split('=')[0].trim(), urls.join('\n'))
            })
        } else if (k === 'online') {
            $ui.loading(true)
            proxyUtil.proxyFromConf({
                urls: servers[k],
                handler: res => {
                    $ui.loading(false)
                    params.handler(res.servers, res.filename, res.url)
                }
            })
        } else {
            $ui.alert('剪贴板存在无法识别的行：\n\n' + servers.ignore.join('\n') + '\n\n以上行将被丢弃！')
        }
    }
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
                            $safari.open({
                                url: "https://jsboxbbs.com/d/290-lhie1"
                            })
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
                            $safari.open({
                                url: "https://t.me/Fndroid",
                            })
                        } else {
                            $safari.open({
                                url: "https://github.com/Fndroid/jsbox_script/tree/master/Rules-lhie1/README.md",
                            })
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
    $ui.menu({
        items: sections.concat(['全部删除', '关键字删除']),
        handler: function (title, idx) {
            if (title === '全部删除') {
                $("serverEditor").data = []
            } else if (title === '关键字删除') {
                $input.text({
                    type: $kbType.default,
                    placeholder: "关键字，空格隔开",
                    text: $("serverControl").info.deleteKeywords || '',
                    handler: function (text) {
                        let keywords = text.split(/\s+/g).filter(i => i !== '')
                        let editorData = $("serverEditor").data
                        editorData.map(section => {
                            section.rows = section.rows.filter(item => keywords.every(k => item.proxyName.text.indexOf(k) === -1))
                            return section
                        })
                        $("serverEditor").data = editorData
                        let controlInfo = $("serverControl").info
                        controlInfo.deleteKeywords = text
                        $("serverControl").info = controlInfo
                        saveWorkspace()
                    }
                })
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
                $("fileName").text = workspace.fileName || ''
                $("serverSuffixEditor").text = workspace.serverSuffix || ''
                let customProxyGroup = workspace.customProxyGroup || {}
                let defaultGroupName = PROXY_HEADER
                if (!(defaultGroupName in customProxyGroup)) {
                    customProxyGroup[defaultGroupName] = []
                }
                let defaultGroup = customProxyGroup[defaultGroupName]
                $("serverEditor").data = workspace.serverData.map(section => {
                    section.rows.map(item => {
                        item.proxyName.bgcolor = defaultGroup.indexOf(item.proxyName.text) > -1 ? selectedColor : defaultColor
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
                $("serverEditor").info = workspace.videoProxy || {}
                $("serverControl").info = {
                    deleteKeywords: workspace.deleteKeywords || '',
                    customProxyGroup: customProxyGroup,
                    currentProxyGroup: defaultGroupName
                }
            } else if (file && !file.workspace) {
                let customProxyGroup = {}
                let defaultGroupName = PROXY_HEADER
                customProxyGroup[defaultGroupName] = []
                let defaultGroup = customProxyGroup[defaultGroupName]
                $("serverControl").info = {
                    deleteKeywords: '',
                    customProxyGroup: customProxyGroup,
                    currentProxyGroup: defaultGroupName
                }
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
        serverSuffix: $("serverSuffixEditor").text,
        videoProxy: $("serverEditor").info || {},
        deleteKeywords: $("serverControl").info.deleteKeywords || '',
        customProxyGroup: $("serverControl").info.customProxyGroup || {}
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
        let customProxyGroup = workspace.customProxyGroup

        let usualValue = function (key) {
            return usualData.find(i => i.title.text == key) ? usualData.find(i => i.title.text == key).title.bgcolor : false
        }

        let ads = usualValue('去广告')
        let isMitm = usualValue('开启MITM')
        let isActionSheet = usualValue('导出配置')
        let surge2 = usualValue('Surge2')

        let serverEditorData = workspace.serverData
        let flatServerData = serverEditorData.reduce((all, cur) => {
            return {
                rows: all.rows.concat(cur.rows)
            }
        }, { rows: [] }).rows

        let proxyNameLegal = function (name) {
            return flatServerData.map(i => i.proxyName.text).concat(getProxyGroups()).concat(['🚀 Direct']).find(i => i === name) !== undefined
        }

        let proxySuffix = workspace.serverSuffix.split(/\s*,\s*/g).map(i => i.replace(/\s/g, ''))
        let proxies = flatServerData.map(i => {
            let notExistSuffix = proxySuffix.filter((ps, idx) => {
                if (idx === 0 && ps === '') return true
                return i.proxyLink.indexOf(ps) < 0
            })
            console.log(notExistSuffix)
            return i.proxyLink + notExistSuffix.join(',')
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
            rules += `\n${v[1]}\n${v[2].replace(/REJECT/g, surge2 ? "REJECT" : "REJECT-TINYGIF")}\n${v[3]}\n${v[4]}\n`
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
                let pgs = advanceSettings.proxyGroupSettings
                pgs = pgs.replace(/Proxy Header/g, proxyHeaders)
                for (let name in customProxyGroup) {
                    let nameReg = new RegExp(name, 'g')
                    let serverNames = customProxyGroup[name]
                    serverNames = serverNames.filter(i => proxyNameLegal(i))
                    pgs = pgs.replace(nameReg, serverNames.join(',') || 'DIRECT')
                }
                prototype = prototype.replace(/\[Proxy Group\][\s\S]+\[Rule\]/, pgs + '\n\n[Rule]')
            } else {
                prototype = prototype.replace(/Proxy Header/g, proxyHeaders)
                prototype = prototype.replace(/ProxyHeader/g, customProxyGroup[PROXY_HEADER].filter(i => proxyNameLegal(i)).join(',') || 'DIRECT')
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
                if (!proxyNameLegal(proxyName)) continue
                rules.match(videoReg[videoType]).forEach(i => {
                    rules = rules.replace(i, i.replace('🍃 Proxy', proxyName))
                })
            }

            prototype = prototype.replace('# Custom', prettyInsert(customRules.add))
            prototype = prototype.replace('Proxys', proxies)
            prototype = prototype.replace('# All Rules', rules)
            prototype = prototype.replace('# Host', host + prettyInsert(userHost.add))
            prototype = prototype.replace('# URL Rewrite', urlRewrite.replace(/307/g, surge2 ? '302': '307') + prettyInsert(userUrl.add))
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
    let workspace = JSON.parse($file.read(FILE).string).workspace
    let usualData = workspace.usualData
    let surge2 = usualData.find(i => i.title.text == 'Surge2') ? usualData.find(i => i.title.text == 'Surge2').title.bgcolor : false
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
                            let surgeScheme = `surge${surge2 ? "": "3"}:///install-config?url=${encodeURIComponent(serverUrl + "download?path=" + fileName)}`
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