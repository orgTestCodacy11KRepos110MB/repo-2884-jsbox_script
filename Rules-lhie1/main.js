const app = require('scripts/app')
const today = require('scripts/today')
const extension = require('scripts/extension')
const updateUtil = require('scripts/updateUtil')

$app.autoKeyboardEnabled = true
$app.rotateDisabled = true
$app.keyboardToolbarEnabled = true

let query = $context.query

let bid = $objc("NSBundle").invoke("mainBundle.bundleIdentifier").rawValue()

$objc('notification').invoke('objectForKey')

if (query.auto == 1) {
    app.autoGen()
    return 
}

if ($app.env === $env.today) {
    today.renderTodayUI(bid)
    return
} else if ($app.env === $env.safari) {
    extension.renderExtensionUI()
    return
} else if ($app.env === $env.action) {
    extension.collectRules()
    return
}

app.setUpWorkspace()

app.renderUI()

updateUtil.getLatestVersion({
    handler: version => {
        console.log([version, updateUtil.getCurVersion()])        
        if (updateUtil.needUpdate(version, updateUtil.getCurVersion())) {
            $http.get({
                url: 'https://raw.githubusercontent.com/Fndroid/jsbox_script/master/Rules-lhie1/updateLog.md' + '?t=' + new Date().getTime(),
                handler: resp=> {
                    updateUtil.updateScript(version)
                }
            })
            
        }
    }
})
