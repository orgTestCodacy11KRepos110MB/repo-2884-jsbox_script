const yaml = require('scripts/js-yaml')
const ini = require('scripts/ini')
const converter = require('scripts/converter')
const demoView = require('scripts/demoView')

if ($app.env !== $env.action) {
  $ui.menu({
    items: ['使用演示 🌄', '运行DEMO 🏖', '打赏作者 🍗'],
    handler: (t, idx) => {
      if (idx === 0) {
        demoView.render()
      } else if (idx === 1) {
        main()
      } else {
        $app.openURL($qrcode.decode($file.read("assets/thankyou2.jpg").image))
      }
    }
  })
  return
}

function main() {
  let profileContent = $file.read("assets/demo.conf").string

  try {
    profileContent = $context.dataItems[0].string
  } catch (e) {

  }

  let iniObj = ini.parse(profileContent)
  // console.log(iniObj.policies)
  let clashObj = converter.convert(iniObj)
  // console.log(clashObj['Proxy Group'])

  let server = $server.new()

  let serverOptions = {
    port: 9090,
  }

  server.addHandler({
    response: req => {
      console.log('req:', req.url)
      let fileName = "Quantumult"
      if (/:9090\/(.+?)$/.test(req.url)) {
        fileName = RegExp.$1
      }
      return {
        type: 'data',
        props: {
          text: yaml.dump(clashObj),
          headers: {
            "Content-Disposition": `attachment;filename="${fileName}.yml"`
          }
        }
      }
    }
  })

  server.listen({
    didStart: server => {
      // console.log('server:', server)
      $ui.alert(`转换成功\n\nhttp://${$device.wlanAddress}:${server.port}`)
    }
  })

  server.start(serverOptions)
}

main()