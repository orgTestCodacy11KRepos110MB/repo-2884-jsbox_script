function renderMainUI() {
  $ui.render({
    props: {
      title: "搜索"
    },
    views: [{
      type: "view",
      props: {
        id: "mainView"
      },
      layout: $layout.fill,
      views: [{
        type: "input",
        props: {

        },
        layout: (make, view) => {
          make.height.equalTo(50);
          make.width.equalTo(view.super).offset(-40);
          make.centerY.equalTo(view.super).offset(-60);
          make.centerX.equalTo(view.super);
        }
      }]
    }]
  })
}

module.exports = {
  renderMainUI: renderMainUI
}