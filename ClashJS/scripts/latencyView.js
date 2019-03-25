const _data = require('./latencyData')

module.exports.render = (address, proxyName) => {
  $ui.push({
    props: {
      title: proxyName,
      bgcolor: $color("tint")
    },
    views: [{
      type: 'list',
      props: {
        id: 'mainHistoryView',
        template: {
          props: {},
          views: [{
            type: 'label',
            props: {
              id: 'logContent',
              lines: 0,
              font: $font("bold", 16)
            },
            layout: (make, view) => {
              // make.width.equalTo(view.super).offset(-20)
              make.left.equalTo(view.super).offset(10)
              make.centerY.equalTo(view.super).offset(0)
            },
            events: {},
            views: []
          }, {
            type: 'label',
            props: {
              id: 'logTime',
              lines: 0,
              font: $font(13),
            },
            layout: (make, view) => {
              // make.width.equalTo(view.super).offset(-20)
              make.right.equalTo(view.super).offset(-10)
              make.centerY.equalTo(view.super).offset(0)
            },
            events: {},
            views: []
          },]
        }
      },
      layout: $layout.fill,
      events: {
        // rowHeight: (sender, indexPath) => {
        //   let text = sender.object(indexPath)
        //   let size = $text.sizeThatFits({
        //     text: text.logContent.text,
        //     width: sender.frame.width - 20,
        //     font: $font("bold", 15),
        //     lineSpacing: 2, // Optional
        //   })
        //   return size.height + 20
        // }
      }
    },]
  })
  _data.getHistory(address, proxyName, res => {
    $("mainHistoryView").data = res.history.map(h => {
      return {
        logContent: { text: h.delay + ' ms' },
        logTime: { text: new Date(h.time).toLocaleString() }
      }
    })
  })
}