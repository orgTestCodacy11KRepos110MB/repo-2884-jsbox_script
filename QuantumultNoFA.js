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

function urlsaveBase64Encode(url) {
    return $text.base64Encode(url).replace(/\-/g, '+').replace(/\\/g, '_').replace(/=+$/, '')
}

const DEFAULT = '选择Google的Policy，不懂就不选 = PROXY\n选择微软服务的Policy，不懂就选择DIRECT = DIRECT\n选择PayPal的Policy，不懂就选择DIRECT = DIRECT\n选择Apple的Policy，不懂就选择DIRECT = DIRECT\n选择Netflix的Policy，不懂就不选 = PROXY\n,(?:PROXY|Proxy) = ,PROXY\n,DIRECT = ,DIRECT\n,REJECT = ,REJECT'

let settings = $cache.get("settings")

console.log('缓存', settings)

$ui.render({
    props: {
        title: "Quantumult"
    },
    views: [{
        type: "view",
        props: {
            id: "mainView"
        },
        layout: $layout.fill,
        views: [{
            type: 'text',
            props: {
                bgcolor: $color("#f2f2f2"),
                radius: 5,
                text: settings? settings: DEFAULT,
                id: 'inputView',
            },
            layout: (make, view) => {
                make.height.equalTo(view.super).dividedBy(3)
                make.width.equalTo(view.super).offset(-30)
                make.centerX.equalTo(view.super)
                make.top.equalTo(15)
            },
            events: {
                didEndEditing: function(sender) {
                    $cache.set('settings', sender.text)
                }
            }
        }, {
            type: 'button',
            props: {
                title: '更新',
                id: 'genBtn',
            },
            layout: (make, view) => {
                make.width.equalTo(view.prev)
                make.centerX.equalTo(view.super)
                make.height.equalTo(40)
                make.top.equalTo(view.prev.bottom).offset(10)
            },
            events: {
                tapped: async _ => {
                    let pattern = $("inputView").text
                    try {
                        await startGen(pattern)
                    } catch (e) {
                        console.error(e.stack)
                    }
                }
            }
        }]
    }]
})

async function startGen(pattern) {
    let resp = await $http.get(CONF)
    let data = resp.data

    let patterns = pattern.split(/[\n\r]+/g).map(i => {
        return i.split(/\s*=\s*/)
    }).filter(i => i.length === 2)
    
    patterns.forEach(i => {
        data = data.replace(new RegExp(i[0], 'g'), i[1])
    })

    console.log(data)

    var success = $file.write({
        data: $data({ string: data }),
        path: "Fndroid.conf"
    })
    if (success) {
        $http.startServer({
            handler: async function (result) {
                let url = result.url + 'download?path=Fndroid.conf'
                let test = await $http.get(url)
                if (test.data) {
                    let scheme = 'quantumult://configuration?filter=' + urlsaveBase64Encode(url)
                    console.log('go')
                    $app.openURL(scheme)
                }
            }
        })
    }
}