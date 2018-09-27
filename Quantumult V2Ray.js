let socketLogger = require("socketLogger")
typeof socketLogger.init === 'function' && socketLogger.init('192.168.50.229')
// SocketLogger Auto Generation Code

console.clear()

console.log("Start logging...");

$app.autoKeyboardEnabled = true
$app.keyboardToolbarEnabled = true

let db = $sqlite.open('user.db')
db.update("CREATE TABLE IF NOT EXISTS subInfo(title TEXT, method TEXT, url TEXT)")

let render = () => {
    const SI = screenInfo()
    $ui.render({
        props: {
            title: "V2Ray Tools",
            id: "mainView"
        },
        views: [{
            type: "list",
            props: {
                id: "mainList",
                bgcolor: $color("clear"),
                separatorHidden: true,
                rowHeight: 90,
                data: loadDBData(),
                actions: [{
                    title: "Remove",
                    color: $color("#e10601"),
                    handler: (sender, indexPath) => {
                        let item = sender.object(indexPath)
                        console.log('item', item);
                        let res = db.update({
                            sql: "DELETE FROM subInfo WHERE rowid = ?",
                            args: [item.raw.rowid]
                        })
                        if (res.result) {
                            sender.delete(indexPath)
                        }
                    }
                }, {
                    title: "Edit",
                    handler: (sender, indexPath) => {
                        let item = sender.object(indexPath)
                        showAlterDialog(item.raw.title, item.raw.method, item.raw.url,(view, group, method, url) => {
                            console.log(group, method, url)
                            if (url) {
                                let res = db.update({
                                    sql: 'UPDATE subInfo SET title = ?, method = ?, url = ? WHERE rowid = ?',
                                    args: [group || 'Fndroid', method || 'chacha20-ietf-poly1305', url, item.raw.rowid]
                                })
                                if (res.result) {
                                    view.remove()
                                    $("mainList").data = loadDBData()
                                } else {
                                    $ui.alert('Something happened, please try again.')
                                }
                            } else {
                                $ui.alert('URL is required!')
                            }
                        })
                    }
                }],
                template: {
                    props: {
                        bgcolor: $color("clear")
                    },
                    views: [{
                        type: "label",
                        props: {
                            id: "group",
                            // font: $font(20),
                        },
                        layout: (make, view) => {
                            make.left.equalTo(view.super).offset(SI.padding)
                            make.top.equalTo(view.super).offset(10)
                        }
                    }, {
                        type: "label",
                        props: {
                            id: "method",
                        },
                        layout: (make, view) => {
                            make.left.equalTo(view.super).offset(SI.padding)
                            make.top.equalTo(view.prev.bottom).offset(5)
                        }
                    }, {
                        type: "label",
                        props: {
                            id: "url"
                        },
                        layout: (make, view) => {
                            make.left.equalTo(view.super).offset(SI.padding)
                            make.top.equalTo(view.prev.bottom).offset(5)
                        }
                    }]
                }
            },
            layout: $layout.fill,
            events: {
                didSelect: async (sender, indexPath, data) => {
                    $ui.loading(true)
                    let url = data.raw.url
                    let rawLinks = null
                    if (/^http/.test(url)) {
                        let resp = await $http.get(url)
                        let respData = resp.data
                        // 兼容不规范ssr链接
                        let noPaddingData = respData
                        let padding = noPaddingData.length % 4 == 0 ? 0 : 4 - noPaddingData.length % 4
                        for (let i = 0; i < padding; i++) {
                            noPaddingData += '='
                        }
                        let decodedData = $text.base64Decode(respData) || $text.base64Decode(noPaddingData)
                        rawLinks = decodedData.split(/[\n\r\|\s]+/g).filter(i => i !== '' && /^vmess:\/\//.test(i));
                    } else if (/^vmess/.test(url)) {
                        rawLinks = [url]
                    }
                    let links = decodeVmess(rawLinks, data.raw.title, data.raw.method);
                    $clipboard.text = links.map(i => `vmess://${urlsafeBase64Encode(i)}`).join('\n')
                    $ui.loading(false)
                    $ui.alert({
                        title: "识别完成",
                        message: `共计识别到${links.length}个V2Ray链接，已复制至剪贴板，请在Quantumult中通过URI导入`,
                        actions: [{
                            title: "Cancle",
                            handler: () => {}
                        }, {
                            title: "Quantumult",
                            handler: () => {
                                $app.openURL("quantumult://")
                            }
                        }]
                    })

                }
            }
        }, {
            type: "button",
            props: {
                icon: $icon("104", $color("white"), $size(20, 20)),
                bgcolor: $color("tint"),
                radius: 25
            },
            layout: (make, view) => {
                make.height.width.equalTo(50)
                make.bottom.equalTo(SI.screenHeight).offset(-20)
                make.right.equalTo(view.super).offset(-20)
            },
            events: {
                tapped: sender => {
                    showAlterDialog('', '', '',(view, group, method, url) => {
                        console.log(group, method, url)
                        if (url) {
                            let res = db.update({
                                sql: 'INSERT INTO subInfo VALUES(?, ?, ?)',
                                args: [group || 'Fndroid', method || 'chacha20-ietf-poly1305', url]
                            })
                            if (res.result) {
                                view.remove()
                                $("mainList").data = loadDBData()
                            } else {
                                $ui.alert('数据保存失败，请重试！')
                            }
                        } else {
                            $ui.alert('链接不能为空！')
                        }
                    })
                }
            }
        }]
    })
}

function loadDBData() {
    let res = db.query({
        sql: 'SELECT rowid, * from subInfo'
    });
    let result = res.result;
    let listData = [];
    while (result.next()) {
        let values = result.values;
        let domain = ''
        if (/(https?:\/\/.*?)(?:\/|$)/.test(values.url)) {
            domain = `${RegExp.$1}/※※※`
        } else if (/^vmess:/.test(values.url)) {

            domain = 'vmess://※※※'
        }
        let itemData = {
            raw: values,
            group: { text: `分组：${values.title}` },
            method: { text: `加密：${values.method}` },
            url: { text: `链接：${domain}` }
        };
        listData.push(itemData);
    }
    return listData;
}

function decodeVmess(links, group, method) {
    let result = []

    for (let idx in links) {
        let link = links[idx]

        if (/^vmess:\/\/(.*?)$/.test(link)) {
            let content = urlsafeBase64Decode(RegExp.$1)
            if (isJson(content)) {
                // v2rayN style
                let jsonConf = JSON.parse(content)
                const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A5366a'
                let obfs = `,obfs=${jsonConf.net === 'ws' ? 'ws' : 'http'},obfs-path="${jsonConf.path || '/'}",obfs-header="Host:${jsonConf.host || jsonConf.add}[Rr][Nn]User-Agent:${ua}"`
                let quanVmess = `${jsonConf.ps} = vmess,${jsonConf.add},${jsonConf.port},${method},"${jsonConf.id}",group=${group},over-tls=${jsonConf.tls === 'tls' ? 'true' : 'false'},certificate=1${jsonConf.type === 'none' && jsonConf.net !== 'ws' ? '' : obfs}`
                result.push(quanVmess)
            } else {
                // Quantumult style
                result.push(content)
            }
        }
    }
    return result
}

function isJson(str) {
    try {
        JSON.parse(str)
    } catch(e) {
        return false
    }
    return true
}

function urlsafeBase64Decode(base64) {
    // Add removed at end '='
    base64 += Array(5 - base64.length % 4).join('=');
    base64 = base64
        .replace(/\-/g, '+') // Convert '-' to '+'
        .replace(/\_/g, '/'); // Convert '_' to '/'
    return $text.base64Decode(base64).replace(/\u0000/, '');
}

function urlsafeBase64Encode(url) {
    return $text.base64Encode(url).replace(/\-/g, '+').replace(/\\/g, '_').replace(/=+$/, '')
}

function showAlterDialog(group, method, url, callback) {
    let view = {
        type: "blur",
        layout: $layout.fill,
        props: {
            id: "alertBody",
            style: 1,
            alpha: 0
        },
        views: [{
            type: "view",
            props: {
                id: "alterMainView",
                bgcolor: $color("#ccc"),
                smoothRadius: 10
            },
            layout: (make, view) => {
                make.height.equalTo(350);
                make.width.equalTo(view.super).offset(-60);
                make.center.equalTo(view.super)
            },
            events: {
                tapped: sender => { }
            },
            views: [{
                type: "label",
                props: {
                    text: "Group",
                    font: $font("bold", 16)
                },
                layout: (make, view) => {
                    make.top.equalTo(view.super).offset(20);
                    make.left.equalTo(view.super).offset(10);
                }
            }, {
                type: "input",
                props: {
                    id: "alterInputGroup",
                    placeholder: "Fndroid",
                    text: group,
                    autoFontSize: true
                },
                events: {
                    returned: sender => {
                        sender.blur()
                    }
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(10);
                    make.width.equalTo(view.super).offset(-20);
                    make.centerX.equalTo(view.super)
                    make.left.equalTo(view.super).offset(10);
                    make.height.equalTo(40)
                }
            }, {
                type: "label",
                props: {
                    text: "Method",
                    font: $font("bold", 16)
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(15);
                    make.left.equalTo(view.super).offset(10);
                }
            }, {
                type: "input",
                props: {
                    id: "alberInputMethod",
                    text: method,
                    placeholder: "chacha20-ietf-poly1305",
                    autoFontSize: true
                },
                events: {
                    tapped: sender => {
                      $("methodView").hidden = false
                    }
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(10);
                    make.width.equalTo(view.super).offset(-20);
                    make.centerX.equalTo(view.super)
                    make.left.equalTo(view.super).offset(10);
                    make.height.equalTo(40)
                }
            }, {
                type: "label",
                props: {
                    text: "URL",
                    font: $font("bold", 16)
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(15);
                    make.left.equalTo(view.super).offset(10);
                }
            }, {
                type: "input",
                props: {
                    id: "alberInputURL",
                    text: url,
                    placeholder: "Required, https:// or vmess://",
                    autoFontSize: true
                },
                events: {
                    returned: sender => {
                        sender.blur()
                    }
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(10);
                    make.width.equalTo(view.super).offset(-20);
                    make.centerX.equalTo(view.super)
                    make.left.equalTo(view.super).offset(10);
                    make.height.equalTo(40)
                }
            }, {
                type: 'button',
                props: {
                    icon: $icon("064", $color("#fff"), $size(20, 20)),
                    id: 'confirmBtn',
                    radius: 25
                },
                layout: (make, view) => {
                    make.height.width.equalTo(50)
                    make.bottom.equalTo(view.super).offset(-15)
                    make.right.equalTo(view.super).offset(-15)
                },
                events: {
                    tapped: sender => {
                        callback && callback($("alertBody"), $("alterInputGroup").text, $("alberInputMethod").text, $("alberInputURL").text);
                        $("alertBody").remove();
                    }
                }
            }, {
                type: "button",
                props: {
                    icon: $icon("018", $color("#fff"), $size(20, 20)),
                    id: 'cameraBtn',
                    radius: 25
                },
                layout: (make, view) => {
                    make.height.width.equalTo(50)
                    make.bottom.equalTo(view.super).offset(-15)
                    make.left.equalTo(view.super).offset(15)
                },
                events: {
                    tapped: async sender => {
                        let qr = await $qrcode.scan({})
                        if (qr) {
                            $("alberInputURL").text = qr
                        }
                    }
                }
            }, {
              type: "view",
              props: {
                id: "methodView",
                hidden: true,
                bgcolor: $color("#dcdcdc")
              },
              views: [{
                type: "label",
                props: {
                  text: "确认",
                  font: $font("bold", 16)
                },
                layout: (make, view) => {
                  make.bottom.equalTo(view.super).offset(-10)
                  make.right.equalTo(view.super).offset(-20)
                  make.height.equalTo(40)
                },
                events: {
                  tapped: sender => {
                    const methods = ['none', 'aes-128-cfb', 'aes-128-gcm', 'chacha20-ietf-poly1305']
                    let selectedRows = $("methodPicker").selectedRows[0]
                    $("alberInputMethod").text = methods[selectedRows]
                    $("methodView").hidden = true
                  }
                }
              }, {
                type: "picker",
                props: {
                  id: "methodPicker",
                  items: [['none', 'aes-128-cfb', 'aes-128-gcm', 'chacha20-ietf-poly1305']]
                },
                layout: (make, view) => {
                  make.bottom.equalTo(view.prev.top)
                  make.height.equalTo(view.super).offset(-50)
                  make.width.equalTo(view.super)
                }
              }],
              layout: $layout.fill
            }],
        }],
        events: {
            tapped: sender => {
                sender.remove()
            }
        }
    }
    $("mainView").add(view)
    $ui.animate({
        duration: 0.2,
        animation: () => {
            $("alertBody").alpha = 1
        }
    })
}

let screenInfo = () => {
    let screenHeight = $device.info.screen.height
    const screenWidth = $device.info.screen.width

    const iPhoneX = screenWidth == 375 && screenHeight == 812
    if (iPhoneX) {
        screenHeight -= 48
    }

    const statusBarHeight = iPhoneX ? 44 : 20
    const navBarHeight = 45
    return {
        screenHeight: screenHeight,
        screenWidth: screenWidth,
        statusBarHeight: statusBarHeight,
        navBarHeight: navBarHeight,
        padding: 10
    }
}

render()
