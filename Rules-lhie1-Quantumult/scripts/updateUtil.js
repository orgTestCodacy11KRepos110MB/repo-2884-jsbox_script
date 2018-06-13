function getCurVersion() {
    let version = $file.read("version.fndroid").string
    return version
}

function getLatestVersion(params) {
    $http.get({
        url: 'https://raw.githubusercontent.com/Fndroid/jsbox_script/master/Rules-lhie1/version.fndroid' + '?t=' + new Date().getTime(),
        handler: res => {
            params.handler(res.data)
        }
    })
}

function updateScript(version) {
    let url = 'https://raw.githubusercontent.com/Fndroid/jsbox_script/master/Rules-lhie1/.output/Rules-lhie1.box' + '?t=' + new Date().getTime()
    $ui.loading(true)
    $http.download({
        url: url,
        progress: (writed, total) => {
            if (writed == total) {
                $delay(1, function() {
                    $ui.alert({
                        message: "更新成功，是否重启？",
                        actions: [{
                            title: "Cancel",
                            handler: function () {}
                        }, {
                            title: "OK",
                            handler: function () {
                                $addin.run("Rules-lhie1")
                            }
                        }]
                    })
                })  
            }
        },
        handler: resp => {
            $ui.loading(false)
            let box = resp.data
            $addin.save({
                name: "Rules-lhie1",
                data: box
            })
        }
    })
}

function needUpdate(nv, ov) {
    let getVersionWeight = i => {
        return i.split('.').map(i => i * 1).reduce((s, i) => s * 100 + i)
    }
    return getVersionWeight(nv) > getVersionWeight(ov)
}


module.exports = {
    getCurVersion: getCurVersion,
    getLatestVersion: getLatestVersion,
    updateScript: updateScript,
    needUpdate: needUpdate
}