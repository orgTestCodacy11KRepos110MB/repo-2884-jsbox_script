const screenUtil = require('scripts/utils/screen')

function render() {
    let screenInfo = screenUtil.screenInfo()
    console.log($device.info)
    console.log('screenInfo', screenInfo);
    console.log($file.read('assets/test.webp'))
    $ui.render({
        props: {
            navBarHidden: true,
            bgcolor: $color("#2d2d2d")
        },
        views: [{
            type: "view",
            layout: (make, view) => {
                make.height.equalTo(screenInfo.navBarHeight)
                make.width.equalTo(view.super).offset(-(screenInfo.padding * 2))
                make.top.equalTo(screenInfo.statusBarHeight)
                make.centerX.equalTo(view.super)
            },
            views: [{
                type: "label",
                props: {
                    text: "Quantumult工具箱",
                    font: $font("bold", 22),
                    textColor: $color("white")
                },
                layout: (make, view) => {
                    make.centerY.equalTo(view.super)
                    make.left.equalTo(view.super).offset(screenInfo.padding)
                }
            }, {
                type: "image",
                props: {
                    data: $file.read('assets/test.webp').image.png
                },
                layout: $layout.center
            }]
        }, {
            type: "view",
            layout: (make, view) => {
                make.height.equalTo(screenInfo.screenHeight - screenInfo.navBarHeight - screenInfo.statusBarHeight)
                make.width.equalTo(view.super).offset(-(screenInfo.padding * 2))
                make.top.equalTo(view.prev.bottom)
                make.centerX.equalTo(view.super)
            },
            views: [{
                type: "list",
                props: {
                    bgcolor: $color("clear"),
                    separatorHidden: true,
                    rowHeight: 70,
                    data: [{
                        itemTitle: { text: "订阅转换" },
                        itemDesc: { text: "识别V2RayNG格式订阅" }
                    }, {
                        itemTitle: { text: "规则更新" },
                        itemDesc: { text: "更新分流规则和链接阻止" }
                    }, {
                        itemTitle: { text: "Rules-lhie1" },
                        itemDesc: { text: "节点和规则管理器" }
                    }],
                    template: {
                        props: {
                            bgcolor: $color("clear")
                        },
                        views: [{
                            type: "label",
                            props: {
                                id: "itemTitle",
                                font: $font(20),
                                textColor: $color("white")
                            },
                            layout: (make, view) => {
                                make.left.equalTo(view.super).offset(screenInfo.padding)
                                make.top.equalTo(view.super).offset(10)
                            }
                        }, {
                            type: "label",
                            props: {
                                id: "itemDesc",
                                textColor: $color("#888888")
                            },
                            layout: (make, view) => {
                                make.left.equalTo(view.super).offset(screenInfo.padding)
                                make.top.equalTo(view.prev.bottom).offset(5)
                            }
                        }]
                    }
                },
                layout: $layout.fill,
                events: {
                    didSelect: (sender, indexPath, data) => {
                        console.log(data)
                    }
                }
            }]
        }]
    })
}

module.exports = {
    render: render
}