let updateScript = function(scriptData) {
    $addin.save({
        name: scriptData.scriptName.text,
        data: $data({ string: scriptData.newData })
    })
    $ui.toast("更新完毕")
}

let renderUI = function (UIData) {
    $ui.render({
        props: {
            title: "脚本更新"
        },
        views: [{
            type: "list",
            props: {
                id: "mainList",
                data: UIData,
                template: {
                    views: [{
                        type: 'label',
                        props: {
                            id: 'scriptName',
                        },
                        layout: (make, view) => {
                            make.height.equalTo(view.super)
                            make.left.equalTo(view.super).offset(10)
                        }
                    }, {
                        type: 'label',
                        props: {
                            id: 'scriptCanUpdate'
                        },
                        layout: (make, view) => {
                            make.height.equalTo(view.super)
                            make.right.equalTo(view.super).offset(-10)
                        }
                    }]
                }
            },
            layout: $layout.fill,
            events: {
                didSelect: (sender, indexPath, data) => {
                    console.log(data.scriptName.text)
                    if (data.newData) {
                        updateScript(data)
                    }
                    // let scriptUrl = data.data.url
                    // data.scriptCanUpdate = ''
                    // $("mainList").delete(indexPath)
                    // $("mainList").insert({
                    //     indexPath: indexPath,
                    //     value: data
                    // })
                }
            }
        }]
    })
}

$app.tips("更新完后重新运行即可检查是否成功")

renderUI([])

let scripts = $addin.list.filter(item => item.url)

let presentData = []

let checkScript = function (scriptInfo) {
    return new Promise((resolve, reject) => {
        $http.get({
            url: scriptInfo.data.url,
            handler: function (resp) {
                let response = resp.response
                let scriptData = resp.data
                if (scriptInfo.data.data.string && scriptInfo.data.data.string != scriptData) {
                    console.log()
                    scriptInfo.scriptCanUpdate = { text: '可更新' }
                    scriptInfo.newData = scriptData
                }
                
                resolve(scriptInfo)
                // if (response.statusCode == 200) {
                //     
                //     // $console.info(scriptInfo.data)
                //     resolve(scriptInfo)
                // } else {
                //     reject()
                // }
            }
        })
    })
}

for (let k in scripts) {
    presentData.push({
        scriptName: { text: scripts[k].name },
        scriptCanUpdate: { text: '' },
        data: scripts[k]
    })
}

let updatedData = []

let promiseData = presentData.map(item => checkScript(item))

$ui.loading(true)

for (let i = 0, p = Promise.resolve(); i < promiseData.length; i++) {
    p = p.then(d => {
        updatedData.push(d)
        return promiseData[i]
    })
    if (i == promiseData.length - 1) {
        p.then((d) => {
            setTimeout(() => {
                updatedData.push(d)
                $ui.loading(false)
                $("mainList").data = updatedData
            }, 1);
        }).catch(() => {
            setTimeout(() => {
                $ui.loading(false)
            }, 1);
        })
    }
}


