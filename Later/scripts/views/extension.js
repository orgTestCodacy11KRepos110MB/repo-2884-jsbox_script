const _screenU = require('scripts/utils/screen')

module.exports.main = (callback) => {
    return {
        props: {
            id: "extensionManiView",
            navBarHidden: true,
            bgcolor: $color("#323232")
        },
        views: [{
            type: "label",
            props: {
                textColor: $color("white"),
                text: "Add to Later",
                font: $font("bold", 30),
            },
            layout: (make, view) => {
                make.top.equalTo(_screenU.statusHeight).offset(30)
                make.left.equalTo(view.super).offset(10)
            }
        }, {
            type: "image",
            props: {
                icon: $icon("225", $color("white"), $size(25, 25)),
                bgcolor: $color("clear")
            },
            layout: (make, view) => {
                make.centerY.equalTo(view.prev)
                make.right.equalTo(-10)
            },
            events: {
                tapped: _ => {
                    $context.close()
                }
            }
        }, {
            type: "input",
            props: {
                radius: 10,
                darkKeyboard: true,
                placeholder: "提醒内容"
            },
            layout: (make, view) => {
                make.height.equalTo(40)
                make.width.equalTo(view.super).offset(-20)
                make.center.equalTo(view.super)
                // make.edges.insets($insets(0, 10, 0, 10))
            },
            events: {
                returned: sender => {
                    sender.blur()
                    typeof callback === 'function' && callback(sender.text)
                }
            }
        }]
    }
}