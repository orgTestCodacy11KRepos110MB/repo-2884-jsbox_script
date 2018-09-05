let socketLogger = require("socketLogger")
typeof socketLogger.init === 'function' && socketLogger.init('192.168.50.229')
// SocketLogger Auto Generation Code

console.clear()

async function main() {
    if (typeof $context.query.url === 'string') {
        let url = $context.query.url
        if (/^https?:\/\//.test(url)) {
            $app.openURL(url)
        } else {
            $quicklook.open({
                url: url
            })
        }
    } else if (typeof $context.query.image === 'string') {
        $quicklook.open({
            image: $file.read($context.query.image).image
        })
    } else if (typeof $context.query.text === 'string') {
        $quicklook.open({
            text: $context.query.text
        })
    } else if (typeof $context.query.data === 'object') {
        $quicklook.open({
            type: 'jpg',
            data: $context.query.data
        })
    }
    let push = ($app.env === $env.action || $app.env === $env.safari)
    if (!$file.exists('imgs')) {
        $file.mkdir('imgs')
    }
    let allItems = $context.allItems
    console.log('all', allItems)
    let notification = {
        mute: true,
        script: $addin.current.name,
        title: `Pin at ${new Date().toLocaleString()}`,
    }
    if (typeof allItems.data === 'object') {
        notification.body = `文件`
        notification.query = {
            data: allItems.data[0]
        }
    } else if (typeof allItems.image === 'object') {
        let success = $file.write({
            data: allItems.image[0].png.jpg(0.2),
            path: 'imgs/noti.png'
        })
        if (success) {
            notification.attachments = ['imgs/noti.png']
            notification.query = {
                image: "imgs/noti.png"
            }
        }
    } else if (typeof allItems.text === 'object') {
        notification.body = allItems.text[0]
        notification.query = {
            text: allItems.text[0]
        }
    } else if (typeof allItems.safari === 'object') {
        notification.body = `链接：${allItems.safari.items.title}`
        notification.query = {
            url: allItems.safari.items.baseURI
        }
    } else if (typeof allItems.link === 'object') {
        notification.body = `链接：${allItems.link[0]}`
        notification.query = {
            url: allItems.link[0]
        }
    }
    if (push) {
        $push.schedule(notification)
    }
}

main()