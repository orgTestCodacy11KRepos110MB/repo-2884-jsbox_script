const _data = require('./logData')

module.exports.render = (address) => {
    $ui.push({
        props: {
            title: "日志",
            bgcolor: $color("tint")
        },
        views: [{
            type: 'list',
            props: {
                id: 'mainLogView',
                template: {
                    props: {},
                    views: [{
                        type: 'label',
                        props: {
                            id: 'logContent',
                            lines: 0,
                            font: $font("bold", 15)
                        },
                        layout: (make, view) => {
                            make.width.equalTo(view.super).offset(-20)
                            make.left.equalTo(view.super).offset(10)
                            make.centerY.equalTo(view.super).offset(-10)
                        },
                        events: {},
                        views: []
                    }, {
                        type: 'label',
                        props: {
                            id: 'logTime',
                            lines: 0,
                            font: $font(12),
                        },
                        layout: (make, view) => {
                            make.width.equalTo(view.super).offset(-20)
                            make.left.equalTo(view.super).offset(10)
                            make.bottom.equalTo(view.super).offset(-5)
                        },
                        events: {},
                        views: []
                    },]
                }
            },
            layout: $layout.fill,
            events: {
                rowHeight: (sender, indexPath) => {
                    let text = sender.object(indexPath)
                    let size = $text.sizeThatFits({
                        text: text.logContent.text,
                        width: sender.frame.width - 20,
                        font: $font("bold", 15),
                        lineSpacing: 2, // Optional
                    })
                    return size.height + 20
                }
            }
        },]
    })
    _data.startLogging(address, log => {
        if (log.event === 'log') {
            let oldData = $("mainLogView").data
            let listLength = oldData.length
            let indexPath = $indexPath(0, listLength)
            oldData.push({
                logContent: { text: log.content.payload },
                logTime: { text: new Date().toLocaleTimeString() }
            })
            $("mainLogView").data = oldData
            $("mainLogView").scrollTo({
                indexPath: indexPath,
                animate: true
            })
        } else if (log.event === 'error') {
            // $ui.alert('链接出现异常，请重新进查看日志')
        }
    })
}