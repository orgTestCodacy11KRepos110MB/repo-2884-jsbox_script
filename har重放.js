let socketLogger = require("socketLogger")
typeof socketLogger.init === 'function' && socketLogger.init('192.168.50.229')
// SocketLogger Auto Generation Code

console.clear()

let importRequest = () => {
    let data = $context.data
    let success = $file.write({
        data: data,
        path: "thor.json"
    });
    $ui.alert(success ? '成功添加至脚本' : '添加到脚本失败，请重试')
}

let handleRequest = async () => {
    if (!$file.exists("thor.json")) {
        $ui.alert('请先导入一个.har文件')
        return
    }
    let infoJson = JSON.parse($file.read('thor.json').string)
    let firstEntriy = infoJson.log.entries[0]
    let firstRequest = firstEntriy.request
    let httpOptions = {
        method: firstRequest.method,
        url: firstRequest.url,
        header: genJsonHeaders(firstRequest.headers)
    }
    if (firstRequest.bodySize > 0) {
        let contentType = firstRequest.postData.mimeType
        let bodyText = firstRequest.postData.text
        if (contentType === 'application/x-www-form-urlencoded') {
            httpOptions.body = genJsonBody(bodyText)
        } else if (contentType === 'application/json') {
            httpOptions.body = JSON.parse(bodyText)
        } else {
            let text = `暂不支持请求体类型『${contentType}』`
            $ui.alert(text)
            siriIntent(text)
            return
        }
    }
    let resp = await $http.request(httpOptions)
    if ($app.env === $env.siri) {
        siriIntent(resp.response.statusCode == 200 ? '重放成功了' : '重放失败了');
    } else {
        $ui.alert({
            title: "重放结果",
            message: resp.data
        })
    }
}

let genJsonHeaders = (arr) => {
    let headers = {}
    arr.forEach(e => {
        headers[e.name] = e.value
    });
    return headers
}

let genJsonBody = str => {
    let body = {}
    str.split('&').forEach(i => {
        if (/^(.*?)=(.*)$/.test(i)) {
            body[RegExp.$1] = RegExp.$2
        }
    })
    return body
}

let main = async () => {
    let env = $app.env
    if (env === $env.action) {
        importRequest()
    } else if (env === $env.siri || env === $env.app) {
        await handleRequest()
    }
}

main().then(_ => {})

function siriIntent(text) {
    $thread.main({
        delay: 0,
        handler: function () {
            $intents.finish(text);
        }
    });
}

