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
    let requestArr = infoJson.log.entries.sort((e1, e2) => {
        return new Date(e1.startedDateTime).getTime() > new Date(e2.startedDateTime).getTime()
    })

    let resArr = []

    for (const req of requestArr) {
        let resp = await requestWithInof(req)
        resArr.push(resp)
    }

    if ($app.env === $env.siri) {
        siriIntent(resArr[resArr.length -1].data);
    } else {
        $ui.alert({
            title: `共${resArr.length}个请求，最后响应体如下`,
            message: resArr[resArr.length -1].data
        })
    }
}

let requestWithInof = async (req) => {
    let requestInof = req.request
    let httpOptions = {
        method: requestInof.method,
        url: requestInof.url,
        header: genJsonHeaders(requestInof.headers)
    }
    if (requestInof.bodySize > 0) {
        let contentType = requestInof.postData.mimeType
        let bodyText = requestInof.postData.text
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
    return resp
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

