const screenUtil = require('scripts/utils/screen')

function push() {
    let screenInfo = screenUtil.screenInfo()
    $ui.push({
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
                    text: "v2rayN订阅转换",
                    font: $font("bold", 22),
                    textColor: $color("white")
                },
                layout: (make, view) => {
                    make.centerY.equalTo(view.super)
                    make.left.equalTo(view.super).offset(screenInfo.padding)
                }
            }]
        }, {
            type: "view",
            layout: (make, view) => {
                make.height.equalTo(screenInfo.screenHeight - screenInfo.navBarHeight - screenInfo.statusBarHeight)
                make.width.equalTo(view.super).offset(-(screenInfo.padding * 2))
                make.top.equalTo(view.prev.bottom)
                make.centerX.equalTo(view.super)
            },
            views: []
        }]
    })
}

module.exports = {
    push: push
}