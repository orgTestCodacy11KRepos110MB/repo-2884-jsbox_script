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

function renderTodayUI(bid) {
    let isLauncher = bid === 'app.cyan.jsbox.ghost'
    let checks = [pm(ruleUpdateUtil.getGitHubFilesSha), pm(updateUtil.getLatestVersion)]
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
    $ui.render({
        props: {
            id: "todayMainView",
            title: "Surge3规则生成",
            frame: $rect(0, 0, sw, 110),
            hideNavbar: true,
            navBarHidden: true,
            bgcolor: $color("clear"),
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
                    data: $file.read("assets/today_surge.png"),
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
                        let workspace = JSON.parse($file.read(FILE).string).workspace
                        let usualData = workspace.usualData
                        let surge2 = usualData.find(i => i.title.text == 'Surge2') ? usualData.find(i => i.title.text == 'Surge2').title.bgcolor : false
                        $app.openURL(`surge${surge2 ? "" : "3"}:///toggle?autoclose=true`)
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
                    text: "Surge开关",
                    font: $font(12),
                    textColor: $rgba(50, 50, 50, .8),
                    align: $align.center
                },
                layout: (make, view) => {
                    make.height.equalTo(10)
                    make.top.equalTo(view.prev.top)
                    make.width.equalTo($("pullBtn").width)
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