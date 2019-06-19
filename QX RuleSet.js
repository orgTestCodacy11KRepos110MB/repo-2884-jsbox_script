$app.autoKeyboardEnabled = true
$app.keyboardToolbarEnabled = true

let fileServer = null

const DEFAULTDATA = {
  list: []
}

const DATAFILE = 'data.json'
if (!$file.exists(DATAFILE)) {
  $file.write({
    data: $data({ string: JSON.stringify(DEFAULTDATA) }),
    path: DATAFILE
  })
}

let render = () => {
  const SI = screenInfo()
  $ui.render({
    props: {
      title: "QX RuleSet",
      id: "mainView",
      navButtons: [{
        title: "Title",
        icon: "165", // Or you can use icon name
        symbol: "checkmark.seal", // SF symbols are supported
        handler: async () => {
          let text = await $input.text({
            type: $kbType.number,
            placeholder: "URL of data.json"
          })
          let links = $detector.link(text)
          if (links.length > 0) {
            $file.write({
              data: $data({ url: links[0] }),
              path: DATAFILE
            })
            render()
          }
        }
      }, {
        title: "Title",
        icon: "074", // Or you can use icon name
        symbol: "checkmark.seal", // SF symbols are supported
        handler: function () {
          showGiftDialog();
        }
      }]
    },
    views: [{
      type: "list",
      props: {
        id: "mainList",
        bgcolor: $color("clear"),
        // separatorHidden: true,
        rowHeight: 65,
        reorder: true,
        data: loadDBData(),
        separatorColor: $rgba(50, 50, 50, 0.2),
        actions: [{
          title: "Remove",
          color: $color("#e10601"),
          handler: (sender, indexPath) => {
            sender.delete(indexPath)
            updateData()
          }
        }, {
          title: "On / Off",
          handler: (sender, indexPath) => {
            let oldData = sender.data
            const item = oldData[indexPath.row].raw
            item.enable = !item.enable
            oldData[indexPath.row] = rawToTemplete(item)
            sender.data = oldData
            updateData()
          }
        }, {
          title: "View",
          color: $color("tint"),
          handler: (sender, indexPath) => {
            const item = sender.object(indexPath).raw
            $ui.preview({
              title: item.policy,
              url: item.url
            })
          }
        }],
        footer: {
          type: "label",
          props: {
            height: 100,
            text: "为了吃饭！",
            textColor: $color("#AAAAAA"),
            align: $align.center,
            font: $font(13)
          },
          events: {
            tapped: sender => {
              showGiftDialog()
            }
          }
        },
        template: {
          props: {
            bgcolor: $color("clear")
          },
          views: [{
            type: "label",
            props: {
              id: "url",
              lines: 1,
              font: $font('Menlo-Regular', 13),
            },
            layout: (make, view) => {
              make.left.equalTo(view.super).offset(SI.padding)
              make.width.equalTo(view.super).offset(- (SI.padding * 2))
              make.top.equalTo(view.super).offset(5)
            }
          }, {
            type: "label",
            props: {
              id: "policy",
              font: $font('Menlo-Regular', 13)
            },
            layout: (make, view) => {
              make.left.equalTo(view.super).offset(SI.padding)
              make.top.equalTo(view.prev.bottom).offset(5)
            }
          }, {
            type: "label",
            props: {
              id: "note",
              font: $font('Menlo-Regular', 11.5)
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
        didSelect: (sender, indexPath, data) => {
          let oldData = sender.data
          const item = oldData[indexPath.row]
          showAlterDialog(item.raw.url, item.raw.policy, item.raw.note, (view, url, policy, note) => {
            if (url && policy) {
              oldData[indexPath.row] = rawToTemplete({ url, policy, note: note || "无备注" })
              sender.data = oldData
              updateData()
            } else {
              $ui.alert('URL和Policy不能为空！')
            }
          })
        },
        reorderFinished: (data) => {
          updateData()
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
        make.left.equalTo(view.super).offset(20)
      },
      events: {
        tapped: sender => {
          showAlterDialog('', '', '', (view, url, policy, note) => {
            if (url && policy) {
              $("mainList").insert({
                index: $('mainList').data.length,
                value: rawToTemplete({ url, policy, note: note || "无备注" })
              })
              updateData()
            } else {
              $ui.alert('URL和Policy不能为空！')
            }
          })
        }
      }
    }, {
      type: "button",
      props: {
        icon: $icon("049", $color("white"), $size(20, 20)),
        bgcolor: $color("tint"),
        radius: 25
      },
      layout: (make, view) => {
        make.height.width.equalTo(50)
        make.bottom.equalTo(SI.screenHeight).offset(-20)
        make.right.equalTo(view.super).offset(-20)
      },
      events: {
        tapped: async (sender) => {
          await generateRules()
        }
      }
    }]
  })
}

function showGiftDialog() {
  $ui.alert({
    title: '感谢支持',
    message: '作者投入大量时间和精力对脚本进行开发和完善，你愿意给他赏杯咖啡支持一下吗？',
    actions: [{
      title: "支付宝",
      handler: () => {
        $app.openURL("https://qr.alipay.com/FKX09054QNRTGGKQZJN6E6");
      }
    }, {
      title: "微信",
      handler: async () => {
        $quicklook.open({
          image: $data({ url: 'https://github.com/Fndroid/jsbox_script/blob/master/Rules-lhie1/assets/thankyou.jpg?raw=true' }).image
        });
      }
    }, {
      title: "返回"
    }]
  });
}

function updateData() {
  let data = readData()
  let listData = $("mainList").data
  data.list = listData.map(l => l.raw)
  $file.write({
    data: $data({ string: JSON.stringify(data) }),
    path: DATAFILE
  })
}

function rawToTemplete(values) {
  const SI = screenInfo()
  const count = SI.screenWidth * 740 / 6400 - 7
  let url = values.url
  if (!values.hasOwnProperty('enable')) {
    values.enable = true
  }
  const l = url.length
  const part = count / 2
  url = url.slice(0, part) + '...' + url.slice(l - part, l)
  const gray = $color("gray")
  const black = $color("black")
  let itemData = {
    raw: values,
    url: { text: `URL: ${url}`, textColor: values.enable ? black : gray },
    policy: { text: `Policy: ${values.policy}`, textColor: values.enable ? black : gray },
    note: { text: `Note: ${values.note}`, textColor: values.enable ? black : gray }
  }
  return itemData
}

function readData() {
  let data = ''
  const file = $file.read(DATAFILE)
  data = JSON.parse(file.string)
  return data
}

function loadDBData() {
  let data = readData()
  if (!data || !data.list) return []
  let listData = [];
  for (let i = 0; i < data.list.length; i++) {
    let values = data.list[i];
    let templeteData = rawToTemplete(values);
    listData.push(templeteData);
  }
  return listData;
}

async function generateRules() {
  $ui.loading(true)
  const listData = loadDBData().map(i => i.raw).filter(i => i.enable)
  const policies = listData.map(i => i.policy)
  const urls = listData.map(i => i.url)
  const contents = await downloadAll(urls)
  const emptyURLs = urls.filter((_, i) => {
    return contents[i] === ''
  })
  const newContents = contents.map(c => modifyRules(c))
  const newContentsWithPolicy = newContents.map((c, i) => {
    c = c.map(r => `${r}, ${policies[i]}`)
    return c
  })
  const result = newContentsWithPolicy.map(c => c.join('\n')).join('\n')
  serveContent(result, async url => {
    $ui.loading(false)

    $clipboard.text = url
    await $http.get(url)
    $ui.alert({
      title: "引用地址已复制至粘贴板",
      message: `如下链接下载失败：\n${emptyURLs.join('\n')}`,
      actions: [
        {
          title: "OK",
          disabled: false, // Optional
          handler: function () {

          }
        },
        {
          title: "QuantumultX",
          handler: function () {
            // $app.openURL("quantumult-x://")
            open_app('com.crossutility.quantumult-x')
          }
        }
      ]
    })
  })

}

function open_app(appid) {
  $objc("LSApplicationWorkspace").invoke("defaultWorkspace").invoke("openApplicationWithBundleID", appid)
}

async function downloadAll(urls) {
  return await Promise.all(urls.map(url => download(url)))
}

async function download(url) {
  let content = ''
  try {
    const resp = await $http.get(url)
    if (resp.response.statusCode === 200) {
      content = resp.data
    }
  } catch (e) { }
  return content
}

function modifyRules(raw) {
  const lines = raw.split(/[\r\n]/)
  let result = lines.map(l => {
    if (/^(#|\/\/|;)/.test(l)) return null
    if (/^(USER\-AGENT|DOMAIN|DOMAIN\-SUFFIX|DOMAIN\-KEYWORD|IP\-CIDR|FINAL|GEOIP)\s*,(.+?)(?:,|$)/.test(l)) {
      return `${RegExp.$1.trim()}, ${RegExp.$2.trim()}`
    }
    return null
  }).filter(l => l)
  return result
}

function serveContent(content, callback) {
  const serverPort = 9898
  try {
    if (fileServer) {
      fileServer.stop()
    }
    let server = $server.new()
    fileServer = server
    let serverOptions = {
      port: serverPort,
    }
    server.addHandler({
      response: req => {
        return {
          type: 'data',
          props: {
            text: content,
            headers: {
            }
          }
        }
      }
    })
    server.listen({
      didStart: server => {
        callback(`http://localhost:${server.port}`)
      }
    })
    server.start(serverOptions)
  }
  catch (e) {
    callback('')
  }
}

function isJson(str) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
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
          text: "URL",
          font: $font("bold", 16)
        },
        layout: (make, view) => {
          make.top.equalTo(view.super).offset(20);
          make.left.equalTo(view.super).offset(10);
        }
      }, {
        type: "input",
        props: {
          id: "alterInputURL",
          placeholder: "https://xxx",
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
          text: "Policy",
          font: $font("bold", 16)
        },
        layout: (make, view) => {
          make.top.equalTo(view.prev.bottom).offset(15);
          make.left.equalTo(view.super).offset(10);
        }
      }, {
        type: "input",
        props: {
          id: "alberInputPolicy",
          text: method,
          placeholder: "PROXY",
          autoFontSize: true
        },
        events: {
          // tapped: sender => {
          //   // $("methodView").hidden = false
          // }
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
          text: "Note",
          font: $font("bold", 16)
        },
        layout: (make, view) => {
          make.top.equalTo(view.prev.bottom).offset(15);
          make.left.equalTo(view.super).offset(10);
        }
      }, {
        type: "input",
        props: {
          id: "alberInputNote",
          text: url,
          placeholder: "代理",
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
            callback && callback($("alertBody"), $("alterInputURL").text, $("alberInputPolicy").text, $("alberInputNote").text);
            $("alertBody").remove();
          }
        }
      }, {
        type: "button",
        props: {
          icon: $icon("018", $color("#fff"), $size(20, 20)),
          id: 'cameraBtn',
          radius: 25,
          hidden: true
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
