module.exports.render = () => {
  $ui.render(
    {
      type: 'view',
      props: {
        id: ''
      },
      layout: $layout.fill,
      events: {},
      views: [{
        type: "image",
        props: {
          data: $data({
            path: "assets/quan_demo.gif"
          })
        },
        layout: $layout.fill
      }]
    }
  )
}