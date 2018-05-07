const ruleUpdateUtil = require('scripts/ruleUpdateUtil')

const sw = $device.info.screen.width

function renderTodayUI() {
    ruleUpdateUtil.getGitHubFilesSha({
        handler: sha => {
            let canUpdate = ruleUpdateUtil.checkUpdate(ruleUpdateUtil.getFilesSha(), sha)
            $("updateStatus").text = canUpdate ? "规则有可用更新" : ""
        }
    })
    $ui.render({
        props: {
            title: "Surge3规则生成"
        },
        views: [{
            type: "view",
            props: {
                id: "",
                // borderColor: $color("black"),
                // borderWidth: 2,
                // radius: 10
            },
            layout: (make, view) => {
                make.height.equalTo(110)
                make.width.equalTo(view.super)
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
            },{
                type: "label",
                props: {
                    id: "updateStatus",
                    text: "查询规则更新...",
                    font: $font(12),
                    textColor: $rgba(50, 50, 50, 1)
                },
                layout: (make, view) => {
                    make.bottom.equalTo(view.super.bottom).offset(-5)
                    make.centerX.equalTo(view.super)
                }
            }, {
                type: "image",
                props: {
                    data: $file.read("assets/today_pull.png"),
                    radius: 25
                },
                layout: (make,view) => {
                    make.width.height.equalTo(50)
                    make.centerY.equalTo(view.super).offset(0)
                    make.centerX.equalTo(view.super)
                },
                events: {
                    tapped: sender => {
                        $app.openURL("jsbox://run?name=Rules-lhie1&auto=1")
                    }
                }
            }, {
                type: "image",
                props: {
                    data: $file.read("assets/today_surge.png"),
                    radius: 25
                },
                layout: (make,view) => {
                    make.width.height.equalTo(50)
                    make.centerY.equalTo(view.super).offset(0)
                    make.right.equalTo(view.prev.left).offset(- (sw / 9))
                },
                events: {
                    tapped: sender => {
                        $app.openURL("surge3:///toggle?autoclose=true")
                    }
                }
            }, {
                type: "image",
                props: {
                    data: $file.read("assets/today_jsbox.png"),
                    radius: 25
                },
                layout: (make,view) => {
                    make.width.height.equalTo(50)
                    make.centerY.equalTo(view.super).offset(0)
                    make.left.equalTo(view.prev.prev.right).offset((sw / 9))
                },
                events: {
                    tapped: sender => {
                        $app.openURL("jsbox://run?name=Rules-lhie1")
                    }
                }
            }]
        }]
    })
}

module.exports = {
    renderTodayUI: renderTodayUI
}