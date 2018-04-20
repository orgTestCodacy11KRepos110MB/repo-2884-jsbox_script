FILE = "password.js"


if ($file.exists(FILE)) {
  let pass = $file.read(FILE).string
  $ui.render({
    props: {
      title: "微信已被锁定",
      bgcolor: $color("#157efb")
    },
    views: [{
      type: "view",
      props: {
        id: ""
      },
      layout: $layout.fill,
      views: [{
        type: "image",
        props: {
          id: "lock_icon",
          src: "https://github.com/Fndroid/jsbox_script/blob/master/imgs/wechatlog_icon.jpg?raw=true"
        },
        layout: (make, view) => {
          make.centerX.equalTo(view.super)
          make.top.equalTo(40)
        }
      }],
      events: {
      }
    }, {
      type: "input",
      props: {
        id: "pass_input",
        align: $align.center,
        secure: true,
        placeholder: "微信密码",
        type: $kbType.number,
      },
      layout: (make, view) => {
        make.centerX.equalTo(view.super),
          make.top.equalTo($("lock_icon").bottom).inset(10)
        make.size.equalTo($size(150, 40))
      },
      events: {
        changed: sender => {
          if ($text.MD5($("pass_input").text) == pass) {
            $("pass_input").text = ""
            $app.openURL("wechat://")
            $app.close()
          }
        },
        didEndEditing: sender => {
          $app.close()
          $objc("UIApplication").invoke("sharedApplication.suspend")
        }
      }
    }]
  })
} else {
  $input.text({
    type: $kbType.number,
    placeholder: "首次进入,请设置密码",
    handler: function (text) {
      $file.write({
        data: $data({ "string": $text.MD5(text) }),
        path: FILE
      })
    }
  })
  
}

$("pass_input").focus()
