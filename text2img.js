$ui.render({
  props: {

  },
  views: [{
    type: "view",
    props: {
      id: "bottomView",
      bgcolor: $color("#fff")
    },
    layout: (make, view) => {
      make.width.equalTo(view.super)
      make.center.equalTo(view.super)
      make.height.equalTo(view.views[0]).offset(40)
    },
    views: [{
      type: "label",
      props: {
        text: $clipboard.text,
        lines: 0
      },
      layout: (make, view) => {
        make.left.equalTo(view.super).offset(20)
        make.centerY.equalTo(view.super)
        make.width.equalTo(view.super).offset(-40)
      },
      events: {
        tapped: sender => {

        }
      },
    }]
  }]
})

$delay(.1, function () {
  $share.wechat($("bottomView").snapshot)
  $app.close()
})
