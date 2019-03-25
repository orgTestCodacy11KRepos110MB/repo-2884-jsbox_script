const _data = require('./indexData')
const _logView = require('./logView')
const _latencyView = require('./latencyView')

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
                },
                actions: [{
                  title: '延迟历史',
                  color: $color("tint"),
                  handler: (sender, idxPath) => {
                    let data = sender.object(idxPath)
                    console.log('sender:', data)
                    _latencyView.render($("urlInputView").text, data.proxyName.text)
                  }
                }]
            },
            layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(0)
                make.width.equalTo(view.super).offset(-20)
                make.centerX.equalTo(view.super)
                make.height.equalTo(view.super).offset(-150 - ($device.isIphoneX ? 40 : 0))
            },
            events: {
                didSelect: async (sender, indexPath, data) => {
                    let oldData = sender.data
                    if (data.checkedIcon.icon === null) {
                        let sec = oldData[indexPath.section].title
                        let success = await _data.switchProxy($("urlInputView").text, sec, data.proxyName.text)
                        if (success) {
                          oldData[indexPath.section].rows = oldData[indexPath.section].rows.map(row => {
                            let copy = row
                            if (row.proxyName.text === data.proxyName.text) {
                              copy.checkedIcon.icon = $icon("136", $color("tint"), $size(20, 20))
                            } else {
                              copy.checkedIcon.icon = null
                            }
                            return copy
                          })
                          sender.data = oldData
                        }
                    }
                },
                forEachItem: (view, indexPath) => {
                    view.borderWidth = 0.5
                    view.borderColor = $rgba(40, 40, 40, 0.1)
                },
                pulled: async sender => {
                    await testLatency(true);
                }
            }
        }, {
          type: 'button',
          props: {
            id: 'latencyBtn',
            title: 'Test Latency',
            bgcolor: $rgba(255, 255, 255)
          },
          layout: (make, view) => {
            make.top.equalTo(view.prev.bottom).offset(5)
            make.height.equalTo(35)
            make.width.equalTo(view.super).offset(-20)
            make.centerX.equalTo(view.super)
          },
          events: {
            tapped: async sender => {
              await testLatency()
            }
          },
          views: []
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
    // $('mainProxyList').scrollTo({
    //     indexPath: $indexPath(0, 0),
    //     animated: true
    // })
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




async function testLatency(pull=false) {
  !pull && $ui.loading("测试中...")
  let listData = $("mainProxyList").data;
  let nodeNames = [];
  listData.forEach(sec => {
    sec.rows.forEach(node => {
      let t = node.proxyName.text;
      if (nodeNames.indexOf(t) === -1) {
        nodeNames.push(t);
      }
    });
  });
  let nodeLat = await _data.latencyTest($("urlInputView").text, nodeNames);
  $("mainProxyList").data = listData.map(sec => {
    let rows = sec.rows;
    rows = rows.map(node => {
      let delay = nodeLat.find(n => n.name === node.proxyName.text).delay;
      node.latencyText = {
        text: delay ? `${delay} ms` : 'Timeout'
      };
      return node;
    });
    return sec;
  });
  pull && $("mainProxyList").endRefreshing();
  !pull && $ui.loading(false)
}

