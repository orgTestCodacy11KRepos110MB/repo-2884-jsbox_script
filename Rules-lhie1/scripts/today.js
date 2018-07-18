const ruleUpdateUtil = require('scripts/ruleUpdateUtil')
const updateUtil = require('scripts/updateUtil')

const loadingHint = "检查规则/脚本更新..."

const scriptName = $addin.current.name

const FILE = 'data.js'

const sw = $device.info.screen.width

let pm = function (method) {
    return new Promise((resolve, reject) => {
        method({
            handler: res => {
                resolve(res)
            }
        })
    })
}

function getIfaData() {
    return Object.keys($network.ifa_data).filter(i => i.indexOf('utun') > -1)
}

function vpnStatus() {
    try {
        // 支持最新TF（$network.proxy_settings）
        let proxySettings = $network.proxy_settings
        let proxyScoped = proxySettings['__SCOPED__']
        let lans = Object.keys(proxyScoped)
        return lans.find(i => i.indexOf('utun') > -1) ? 1 : 0
    } catch (e) {
        // 兼容旧版，需要手动设置状态
        if ($cache.get("surgeOn")) {
            let surgeOn = $cache.get('surgeOn')
            let nowIfa = getIfaData()
            let oldIfa = surgeOn.ifaKeys
            if (nowIfa.length === oldIfa.length) {
                return surgeOn.status ? 1 : 0
            } else {
                return surgeOn.status ? 0 : 1
            }
        }
        return -1
    }
}

function genSrugeLabel(status, isQuan) {
    if (status === -1) {
        return '长按设置'
    } else if (status === 0) {
        return isQuan ? '开启Quantumult' : '开启Surge'
    } else {
        return isQuan ? '关闭Quantumult' : '关闭Surge'
    }
}

function renderTodayUI() {
    let workspace = JSON.parse($file.read(FILE).string).workspace
    let outputFormat = workspace.outputFormat
    let surge2 = outputFormat === 'Surge2'
    let isQuan = outputFormat === 'Quan'
    let isLauncher = $app.widgetIndex < 0 || $app.widgetIndex > 2
    let checks = [pm(ruleUpdateUtil.getGitHubFilesSha), pm(updateUtil.getLatestVersion)]
    let vStatus = vpnStatus()
    Promise.all(checks).then(res => {
        let canUpdate = ruleUpdateUtil.checkUpdate(ruleUpdateUtil.getFilesSha(), res[0])
        let newVersion = updateUtil.needUpdate(res[1], updateUtil.getCurVersion())
        $("newTag").hidden = !canUpdate
        $("newVersionTag").hidden = !newVersion
        return canUpdate ? pm(ruleUpdateUtil.getLatestCommitMessage) : Promise.resolve()
    }).then(res => {
        let { owner, repoName, filePath } = ruleUpdateUtil.getRepoInfo()
        $("updateStatus").text = res ? res.commit.message : `${owner}\/${repoName}`
    })
    let targetAppOn = $file.read("assets/today_surge.png")
    let targetAppOff = $file.read("assets/today_surge_off.png")
    if (isQuan) {
        targetAppOn = $file.read("assets/today_quan.png")
        targetAppOff = $file.read("assets/today_quan_off.png")
    }
    $ui.render({
        props: {
            id: "todayMainView",
            title: "Surge3规则生成",
            hideNavbar: true,
            navBarHidden: true,
        },
        views: [{
            type: "blur",
            props: {
                id: "close",
                style: 1,
                radius: 0,
                hidden: !isLauncher
            },
            layout: (make, view) => {
                make.width.height.equalTo(view.super).offset(10)
                make.top.equalTo(view.super.top).offset(-10)
            },
            events: {
                tapped: sender => {
                    $app.close(0.3)
                }
            }
        }, {
            type: "view",
            props: {
                id: "",
            },
            layout: (make, view) => {
                make.height.equalTo(110)
                make.width.equalTo(view.super).offset(0)
                make.center.equalTo(view.super)
            },
            views: [{
                type: "label",
                props: {
                    id: "updateStatus",
                    text: "Rules-lhie1 by Fndroid",
                    font: $font(12),
                    textColor: $rgba(50, 50, 50, .3)
                },
                layout: (make, view) => {
                    make.top.equalTo(view.super.top).offset(5)
                    make.centerX.equalTo(view.super)
                }
            }, {
                type: "label",
                props: {
                    id: "updateStatus",
                    text: loadingHint,
                    font: $font(12),
                    textColor: $rgba(50, 50, 50, .3)
                },
                layout: (make, view) => {
                    make.bottom.equalTo(view.super.bottom).offset(-5)
                    make.centerX.equalTo(view.super)
                }
            }, {
                type: "image",
                props: {
                    id: "pullBtn",
                    data: $file.read("assets/today_pull.png"),
                    radius: 25,
                    bgcolor: $rgba(255, 255, 255, 0)
                },
                layout: (make, view) => {
                    make.width.height.equalTo(55)
                    make.centerY.equalTo(view.super).offset(-10)
                    make.centerX.equalTo(view.super)
                },
                events: {
                    tapped: sender => {
                        $app.openURL(`jsbox://run?name=${encodeURIComponent(scriptName)}&auto=1`)
                    }
                },
            }, {
                type: "image",
                props: {
                    id: "surgeBtn",
                    data: vStatus === 0 ? targetAppOff : targetAppOn,
                    radius: 25,
                    bgcolor: $rgba(255, 255, 255, 0)
                },
                layout: (make, view) => {
                    make.width.height.equalTo(55)
                    make.centerY.equalTo(view.super).offset(-10)
                    make.right.equalTo(view.prev.left).offset(- (sw / 9))
                },
                events: {
                    tapped: sender => {
                        let url = `surge${surge2 ? "" : "3"}:///toggle?autoclose=true`
                        if (isQuan) {
                            url = 'quantumult://' + (vStatus === 0 ? 'start' : 'stop')
                        }
                        $app.openURL(url)
                    },
                    longPressed: sender => {
                        $ui.alert({
                            title: "初始设置",
                            message: '请选择当前VPN开关状态？',
                            actions: [{
                                title: '已关闭',
                                handler: () => {
                                    $cache.set("surgeOn", {
                                        status: false,
                                        ifaKeys: getIfaData()
                                    })
                                }
                            }, {
                                title: '已开启',
                                handler: () => {
                                    $cache.set("surgeOn", {
                                        status: true,
                                        ifaKeys: getIfaData()
                                    })
                                }
                            }]
                        })
                    }
                }
            }, {
                type: "image",
                props: {
                    id: "jsboxBtn",
                    data: $file.read("assets/today_jsbox.png"),
                    radius: 25,
                    bgcolor: $rgba(255, 255, 255, 0)
                },
                layout: (make, view) => {
                    make.width.height.equalTo(50)
                    make.centerY.equalTo(view.super).offset(-10)
                    make.left.equalTo(view.prev.prev.right).offset((sw / 9))
                },
                events: {
                    tapped: sender => {
                        $app.openURL(`jsbox://run?name=${encodeURIComponent(scriptName)}`)
                    }
                }
            }, {
                type: "label",
                props: {
                    text: "更新规则",
                    font: $font(12),
                    textColor: $rgba(50, 50, 50, .8),
                    align: $align.center
                },
                layout: (make, view) => {
                    make.height.equalTo(10)
                    make.top.equalTo($("pullBtn").bottom)
                    make.width.equalTo($("pullBtn").width)
                    make.centerX.equalTo($("pullBtn"))
                }
            }, {
                type: "label",
                props: {
                    id: "surgeLabel",
                    text: genSrugeLabel(vStatus, isQuan),
                    font: $font(12),
                    textColor: $rgba(50, 50, 50, .8),
                    align: $align.center
                },
                layout: (make, view) => {
                    make.height.equalTo(10)
                    make.top.equalTo(view.prev.top)
                    make.centerX.equalTo($("surgeBtn"))
                }
            }, {
                type: "label",
                props: {
                    text: "脚本设置",
                    font: $font(12),
                    textColor: $rgba(50, 50, 50, .8),
                    align: $align.center
                },
                layout: (make, view) => {
                    make.height.equalTo(10)
                    make.top.equalTo($("pullBtn").bottom)
                    make.width.equalTo($("pullBtn").width)
                    make.centerX.equalTo($("jsboxBtn"))
                }
            }, {
                type: "image",
                props: {
                    id: "newTag",
                    data: $file.read("assets/new_rules_tag.png"),
                    bgcolor: $rgba(255, 255, 255, 0),
                    hidden: true
                },
                layout: (make, view) => {
                    make.width.height.equalTo(15)
                    make.centerY.equalTo(view.super).offset(-20)
                    make.left.equalTo($("pullBtn").right).offset(-10)
                }
            }, {
                type: "image",
                props: {
                    id: "newVersionTag",
                    data: $file.read("assets/new_version_tag.png"),
                    bgcolor: $rgba(255, 255, 255, 0),
                    hidden: true
                },
                layout: (make, view) => {
                    make.width.height.equalTo(15)
                    make.centerY.equalTo(view.super).offset(-20)
                    make.left.equalTo($("jsboxBtn").right).offset(-10)
                }
            }, {
                type: "image",
                props: {
                    id: "closeBtn",
                    data: $file.read("assets/close_icon.png"),
                    bgcolor: $rgba(255, 255, 255, 0),
                    hidden: !isLauncher,
                    alpha: 0.7
                },
                layout: (make, view) => {
                    make.width.height.equalTo(20)
                    make.top.equalTo(view.super.top).offset(10)
                    make.right.equalTo(view.super.right).offset(-10)
                },
                events: {
                    tapped: sender => {
                        $app.close(.2)
                    }
                }
            }]
        }]
    })
}

module.exports = {
    renderTodayUI: renderTodayUI
}