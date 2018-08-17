/*

说明：

此脚本（QuantumultNoFA）仅用于更新Quantumult的Filter部分，可以免去每次Update都要设置的麻烦

1. 格式：正则（选择部分） = 替换（节点或Policy名）
2. 如果替换部分在Quantumult不存在，则默认是PROXY

例如：

把默认的PROXY统统改为“🍃 Proxy”，可以这么写：
,(?:PROXY|Proxy) = ,🍃 Proxy

*/


$app.autoKeyboardEnabled = true

const CONF = 'https://raw.githubusercontent.com/lhie1/Rules/master/Quantumult/Quantumult.conf'

const CACHEKEY = 'listData'

function urlsaveBase64Encode(url) {
    return $text.base64Encode(url).replace(/\-/g, '+').replace(/\\/g, '_').replace(/=+$/, '')
}

const DEFAULT = [
    {
        reg: { text: "选择Google的Policy，不懂就不选" },
        rep: { text: "PROXY" }
    }, {
        reg: { text: "选择微软服务的Policy，不懂就选择DIRECT" },
        rep: { text: "DIRECT" }
    }, {
        reg: { text: "选择PayPal的Policy，不懂就选择DIRECT" },
        rep: { text: "DIRECT" }
    }, {
        reg: { text: "选择Apple的Policy，不懂就选择DIRECT" },
        rep: { text: "DIRECT" }
    }, {
        reg: { text: "选择Netflix的Policy，不懂就不选" },
        rep: { text: "PROXY" }
    }, {
        reg: { text: "(?:PROXY|Proxy)" },
        rep: { text: ",PROXY" }
    }, {
        reg: { text: ",DIRECT" },
        rep: { text: ",DIRECT" }
    }, {
        reg: { text: ",REJECT" },
        rep: { text: ",REJECT" }
    }
]

let cacheData = $cache.get(CACHEKEY)

$ui.render({
    props: {
        title: "Quantumult",
        navBarHidden: true,
        statusBarStyle: 0
    },
    views: [{
        type: "view",
        props: {
            id: "mainView"
        },
        layout: $layout.fill,
        views: [{
            type: 'list',
            props: {
                data: cacheData || DEFAULT,
                rowHeight: 60,
                id: "mainList",
                actions: [{
                    title: "delete",
                    handler: (sender, indexPath) => {
                        $cache.set(CACHEKEY, sender.data)
                    }
                }],
                footer: {
                    type: "view",
                    props: {
                        height: 65
                    }
                },
                template: {
                    props: {},
                    views: [{
                        type: "label",
                        props: {
                            id: "reg",
                            font: $font("bold", 16)
                        },
                        layout: (make, view) => {
                            make.height.equalTo(view.super.height).multipliedBy(0.5);
                            make.width.equalTo(view.super).offset(-30);
                            make.left.equalTo(view.super).offset(15);
                            make.top.equalTo(view.super);
                        }
                    }, {
                        type: "label",
                        props: {
                            id: "rep",
                            font: $font("bold", 16),
                            textColor: $color("#777")
                        },
                        layout: (make, view) => {
                            make.height.equalTo(view.super.height).multipliedBy(0.5);
                            make.width.equalTo(view.super).offset(-30);
                            make.left.equalTo(view.super).offset(15);
                            make.top.equalTo(view.prev.bottom)
                        }
                    }]
                }
            },
            layout: (make, view) => {
                make.height.equalTo(view.super).offset(-20)
                make.width.equalTo(view.super)
                make.centerX.equalTo(view.super)
                make.top.equalTo(20)
            },
            events: {
                didSelect: (sender, indexPath, data) => {
                    let item = sender.object(indexPath)
                    let newReg, newRep
                    showAlterDialog(item.reg.text, item.rep.text, (newReg, newRep) => {
                        console.log(newReg, newRep)
                        let oldData = sender.data;
                        oldData[indexPath.row] = {
                            reg: { text: newReg },
                            rep: { text: newRep }
                        }
                        sender.data = oldData
                        $cache.set(CACHEKEY, sender.data)
                    })
                }
            }
        }, {
            type: 'button',
            props: {
                icon: $icon("165", $color("#fff"), $size(20, 20)),
                id: 'genBtn',
                radius: 25
            },
            layout: (make, view) => {
                make.height.width.equalTo(50)
                make.bottom.right.equalTo(view.super).offset(-15)
            },
            events: {
                tapped: async _ => {
                    let pattern = $("mainList").data
                    try {
                        await startGen(pattern)
                    } catch (e) {
                        console.error(e.stack)
                    }
                }
            }
        }, {
            type: 'button',
            props: {
                icon: $icon("104", $color("#fff"), $size(20, 20)),
                id: 'addBtn',
                radius: 25
            },
            layout: (make, view) => {
                make.height.width.equalTo(50)
                make.bottom.equalTo(view.super).offset(-15)
                make.right.equalTo(view.prev.left).offset(-15)
            },
            events: {
                tapped: sender => {
                    showAlterDialog('', '', (newReg, newRep) => {
                        let oldData = $("mainList").data;
                        oldData.push({
                            reg: { text: newReg },
                            rep: { text: newRep }
                        })
                        $("mainList").data = oldData;
                        $cache.set(CACHEKEY, $("mainList").data)
                    })
                }
            }
        }]
    }]
})

function showAlterDialog(reg, rep, callback) {
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
                make.height.equalTo(250);
                make.width.equalTo(view.super).offset(-60);
                make.center.equalTo(view.super)
            },
            events: {
                tapped: sender => { }
            },
            views: [{
                type: "label",
                props: {
                    text: "正则表达式",
                    font: $font("bold", 16)
                },
                layout: (make, view) => {
                    make.top.equalTo(view.super).offset(20);
                    make.left.equalTo(view.super).offset(10);
                }
            }, {
                type: "input",
                props: {
                    id: "alterInputReg",
                    text: reg,
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
                    text: "替换文本",
                    font: $font("bold", 16)
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(15);
                    make.left.equalTo(view.super).offset(10);
                }
            }, {
                type: "input",
                props: {
                    id: "alberInputRep",
                    text: rep,
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
                        callback && callback($("alterInputReg").text, $("alberInputRep").text);
                        $("alertBody").remove();
                    }
                }
            }]
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

async function startGen(pattern) {
    let resp = await $http.get(CONF)
    let data = resp.data

    let patterns = pattern.map(i => {
        return [i.reg.text, i.rep.text]
    })

    patterns.forEach(i => {
        data = data.replace(new RegExp(i[0], 'g'), i[1])
    })

    console.log(data)

    var success = $file.write({
        data: $data({ string: data }),
        path: "Fndroid.conf"
    })
    if (success) {
        let result = await $http.startServer({})
        let url = `http://127.0.0.1:${result.port}/download?path=Fndroid.conf`
        let test = await $http.get(url)
        const REJECT = 'https://raw.githubusercontent.com/lhie1/Rules/master/Quantumult/Quantumult_URL.conf'
        if (test.data) {
            let scheme = `quantumult://configuration?filter=${urlsaveBase64Encode(url)}&rejection=${urlsaveBase64Encode(REJECT)}`
            $app.openURL(scheme)
        }
    }
}