let socketLogger = require("socketLogger")
typeof socketLogger.init === 'function' && socketLogger.init('192.168.50.229')
// SocketLogger Auto Generation Code

$ui.render({
  props: {
    navBarHidden: true,
    statusBarStyle: 1,
  },
  views: [{
    type: "view",
    layout: $layout.fill,
    props: {
      bgcolor: $color("#24292e")
    }
  },{
    type: "web",
    props: {
      url: "https://www.github.com",
      toolbar: true,
      showsProgress: false,
      bounces: false
    },
    layout: (make, view) => {
      make.top.equalTo(22)
      make.height.equalTo(view.super).offset(22)
      make.width.equalTo(view.super)
    }
  }]
})