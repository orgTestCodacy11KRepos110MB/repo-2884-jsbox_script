const _data = require('./indexData')
const _logView = require('./logView')

module.exports.render = async () => {
    $ui.render({
        props: {
            title: "Clash面板",
            bgcolor: $color("tint"),
            navButtons: [{
                title: "Title",
                icon: "121",
                handler: async () => {
                    _logView.render($("urlInputView").text)
                }
            }]
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
        },{
            type: 'view',
            props: {
                bgcolor: $color("white")
            },
            layout: (make, view) => {
                make.width.equalTo(view.super).offset(-20)
                make.top.equalTo(view.prev.bottom).offset(30)
                make.left.equalTo(view.super).offset(10)
                make.height.equalTo(60)
            }
        }, {
            type: 'menu',
            props: {
                id: 'proxyGroupMenu',
                smoothRadius: 8
            },
            layout: (make, view) => {
                make.height.equalTo(40)
                make.width.equalTo(view.super).offset(-20)
                make.top.equalTo(view.prev.prev.bottom).offset(10)
                make.left.equalTo(view.super).offset(10)
            },
            events: {
                changed: sender => {
                    let index = sender.index
                    let listData = $("mainProxyList").data.slice(0, index)
                    console.log('listData', listData);
                    let secNum = listData.length
                    let itemNum = 0
                    listData.forEach(i => {
                        itemNum += i.rows.length
                    })
                    let offset = secNum * 27 + itemNum * 50
                    $("mainProxyList").scrollToOffset($point(0, offset));
                }
            }
        }, {
            type: 'list',
            props: {
                id: 'mainProxyList',
                separatorHidden: true,
                rowHeight: 50,
                radius: 7,
                data: [],
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
                make.top.equalTo(view.prev.bottom).offset(0)
                make.width.equalTo(view.super).offset(-20)
                make.centerX.equalTo(view.super)
                make.height.equalTo(view.super).offset(-110 - ($device.isIphoneX ? 40 : 0))
            },
            events: {
                didSelect: async (sender, indexPath, data) => {
                    if (data.checkedIcon.icon === null) {
                        let sec = sender.data[indexPath.section].title
                        await _data.switchProxy($("urlInputView").text, sec, data.proxyName.text)
                        await loadData()
                    }
                },
                forEachItem: (view, indexPath) => {
                    view.borderWidth = 0.5
                    view.borderColor = $rgba(40, 40, 40, 0.1)
                },
                pulled: async sender => {
                    let listData = $("mainProxyList").data
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
    $("urlInputView").text === '' && guessAddress()
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
    let mode = config.mode
    listData = listData.filter(i => {
        if (mode === 'Global') {
            return i.title === 'GLOBAL'
        } else if (mode === 'Direct') {
            return i.title === 'DIRECT'
        }
        return i.title !== 'GLOBAL' && i.title !== 'DIRECT'
    })
    $("proxyGroupMenu").items = listData.map(i => i.title)
    $("proxyGroupMenu").index = 0
    $('proxyWayBtn').title = config.mode
    $('mainProxyList').data = listData
    $('mainProxyList').scrollTo({
        indexPath: $indexPath(0, 0),
        animated: true
    })
}

let guessAddress = async () => {
    let address = await _data.sniffAddress()
    if (address) {
        $device.taptic(1)
        $ui.alert({
            title: "提示",
            message: `嗅探到当前网络下Clash的目标地址可能为 ${address} ，是否直接使用？`,
            actions: [{
                title: "取消",
                handler: () => {

                }
            }, {
                title: "好的",
                handler: async () => {
                    $("urlInputView").text = address
                    $cache.set('address', address)
                    await loadData()
                }
            }]
        })
    }
}




