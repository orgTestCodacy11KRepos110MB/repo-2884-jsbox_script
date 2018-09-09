
const urlUtil = require('scripts/utils/url')
const promise = require('scripts/utils/promise')

const GITHUB_RAW_PREFIX = 'https://raw.githubusercontent.com/Fndroid/jsbox_script/master/QuantumultTools'

function currentVersion() {
    return $file.read('version.fndroid').string
}

async function latestVersion() {
    let resp = await $http.get(urlUtil.withTS(`${GITHUB_RAW_PREFIX}/version.fndroid`))
    return resp.data
}

async function latestBox() {
    let resp = await $http.download({
        url: urlUtil.withTS(`${GITHUB_RAW_PREFIX}/.output/QuantumultTools.box`),
        showsProgress: false
    })
    return resp.data
}

async function updateHandler() {
    let lv = versionWeight(await latestVersion())
    let cv = versionWeight(currentVersion())
    if (lv > cv) {
        let boxData = await latestBox()
        $addin.save({
            name: $addin.current.name,
            data: boxData,
            handler: success => {
                if (success) {
                    $ui.toast('新版本已成功安装，下次启动生效')
                }
            }
        })
    }
}

function versionWeight(versionStr) {
    let pow = 1
    return versionStr.split(/\./g).reverse().reduce((w, c) => {
        let s = w + c * pow
        pow *= 100
        return s
    }, 0)
}

module.exports = {
    updateHandler: updateHandler
}