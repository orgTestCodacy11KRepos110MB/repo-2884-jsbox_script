const app = require('scripts/app')
const updateUtil = require('scripts/updateUtil')

updateUtil.getLatestVersion({
    handler: version => {
        console.log([version, updateUtil.getCurVersion()])        
        if (version == updateUtil.getCurVersion()) {
            app.renderUI()
        } else {
            $http.get({
                url: 'https://raw.githubusercontent.com/Fndroid/jsbox_script/master/Rules-lhie1/updateLog.md' + `?t=${new Date().getTime()}`,
                handler: resp=> {
                    $ui.render({
                        props: {
                            title: "更新可用"
                        },
                        views: [{
                            type: "markdown",
                            props: {
                                id: "",
                                content: `## 新版：${version}\n> 当前：${updateUtil.getCurVersion()}\n\n${resp.data}`
                            },
                            layout: (make, view) => {
                                make.size.equalTo(view.super)
                            }
                        }, {
                            type: 'button',
                            props: {
                                title: "更新",
                                id: "updateBtn"
                            },
                            layout: (make, view)=> {
                                make.bottom.equalTo(view.super).offset(-10)
                                make.width.equalTo(view.super).offset(-30)
                                make.centerX.equalTo(view.super)
                                make.height.equalTo(40)
                            },
                            events: {
                                tapped: sender=> {
                                    updateUtil.updateScript(version)
                                }
                            }
                        }]
                    })
                }
            })
            
        }
    }
})