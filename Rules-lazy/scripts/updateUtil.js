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
    const scriptName = $addin.current.name
    $http.download({
        url: url,
        handler: resp => {
            let box = resp.data
            $addin.save({
                name: scriptName,
                data: box,
                handler: (success) => {
                    if (success) {
                        let donateList = $file.read("donate.md").string
                        let names = donateList.split(/[\r\n]+/).filter(i => i!== '')
                        $ui.toast(`静默更新完成，感谢${names.length - 3}位老板`)
                    }
                }
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