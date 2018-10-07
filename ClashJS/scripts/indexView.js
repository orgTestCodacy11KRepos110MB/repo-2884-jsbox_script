const _data = require('scripts/indexData')
const _logView = require('scripts/logView')

module.exports.render = async () => {
    $ui.render({
        props: {
            title: "Clash面板",
            bgcolor: $color("tint"),
            // navButtons: [{
            //     title: "Title",
            //     icon: "121",
            //     handler: () => {
            //         _logView.render($("urlInputView").text)
            //     }
            // }]
        },
        views: [{
            type: 'button',
            props: {
                id: 'proxyWayBtn',
                title: "Mode",
                bgcolor: $color("#e7eaed"),
                titleColor: $color("black")
            },
            layout: (make, view) => {
                make.top.equalTo(view.super).offset(10)
                make.width.equalTo(100)
                make.height.equalTo(40)
                make.right.equalTo(view.super).offset(-10)
            },
            events: {
                tapped: sender => {
                    modeMenu().then(res => { })
                }
            }
        }, {
            type: 'input',
            props: {
                id: 'urlInputView',
                placeholder: '192.168.xx.xx:8080',
                text: $cache.get('address') || ''
            },
            layout: (make, view) => {
                make.top.equalTo(view.super).offset(10)
                make.width.equalTo(view.super).offset(-130)
                make.height.equalTo(40)
                make.left.equalTo(view.super).offset(10)
            },
            events: {
                returned: async sender => {
                    $cache.set('address', sender.text)
                    sender.blur()
                    await loadData()
                }
            }
        }, {
            type: 'list',
            props: {
                id: 'mainProxyList',
                separatorHidden: true,
                rowHeight: 50,
                radius: 7,
                data: [{
                    proxyName: { text: 'hello' }
                }],
                template: {
                    props: {

                    },
                    views: [{
                        type: 'label',
                        props: {
                            id: 'proxyName',
                            font: $font("bold", 16),
                            textColor: $color("black")
                        },
                        layout: (make, view) => {
                            make.left.equalTo(view.super).offset(10)
                            make.centerY.equalTo(view.super).offset(-10)
                            make.width.equalTo(view.super).offset(-50)
                        }
                    }, {
                        type: 'image',
                        props: {
                            id: 'checkedIcon',
                            bgcolor: $color("clear")
                        },
                        layout: (make, view) => {
                            make.left.equalTo(view.prev.right).offset(15)
                            make.centerY.equalTo(view.super)
                            make.size.equalTo($size(15, 15))
                        }
                    }, {
                        type: 'label',
                        props: {
                            id: 'latencyText',
                            text: '-- ms',
                            font: $font("bold", 14),
                            textColor: $color("tint")
                        },
                        layout: (make, view) => {
                            make.centerY.equalTo(view.super).offset(10)
                            make.left.equalTo(view.super).offset(10)
                            make.width.equalTo(view.super)
                            make.height.equalTo(14)
                        }
                    },]
                }
            },
            layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(10)
                make.width.equalTo(view.super).offset(-20)
                make.centerX.equalTo(view.super)
                make.height.equalTo(view.super).offset(-70 - ($device.isIphoneX ? 40 : 0))
            },
            events: {
                didSelect: async (sender, indexPath, data) => {
                    console.log('data', data);
                    if (data.checkedIcon.icon === null) {
                        let sec = sender.data[indexPath.section].title
                        await _data.switchProxy($("urlInputView").text, sec, data.proxyName.text)
                        await loadData()
                    }
                },
                pulled: async sender => {
                    let listData = $("mainProxyList").data
                    console.log('listData', listData);
                    let nodeNames = []
                    listData.forEach(sec => {
                        sec.rows.forEach(node => {
                            let t = node.proxyName.text
                            if (nodeNames.indexOf(t) === -1) {
                                nodeNames.push(t)
                            }
                        })
                    })
                    let nodeLat = await _data.latencyTest($("urlInputView").text, nodeNames)
                    $("mainProxyList").data = listData.map(sec => {
                        let rows = sec.rows
                        rows = rows.map(node => {
                            let delay = nodeLat.find(n => n.name === node.proxyName.text).delay
                            node.latencyText = {
                                text: delay ? `${delay} ms` : 'Offline'
                            }
                            return node
                        })
                        return sec
                    })
                    sender.endRefreshing()
                }
            }
        },]
    })
    await loadData()
}

let modeMenu = async () => {
    let res = await $ui.menu({
        items: ['Global', 'Rule', 'Direct']
    })
    await _data.switchMode($("urlInputView").text, res.title)
    await loadData()
}

let loadData = async () => {
    let address = $("urlInputView").text
    let [listData, config] = await Promise.all([_data.getProxiesInfo(address), _data.getConfig(address)])
    console.log('config', config);
    console.log('listData', listData)
    $('mainProxyList').data = listData
    $('proxyWayBtn').title = config.mode
}





