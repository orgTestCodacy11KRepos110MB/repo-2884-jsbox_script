module.exports.startLogging = (address, callback) => {
    $define({
        type: "ChunkController: NSObject",
        events: {
            "connection:didReceiveData:": function (conn, data) {
                var strData = $text.decodeData({
                    data: data.rawValue(),
                    encoding: 4
                })
                try {
                    strData.split('\n').filter(i => i).forEach(log => {
                        callback({
                            event: "log",
                            content: JSON.parse(log)
                        })
                    })
                } catch(e) {
                    console.error(strData)
                }
            },
            "connection:didReceiveResponse:": function (conn, resp) {
                // console.log('resp got')
            },
            "connection:didFailWithError:": function (conn, error) {
                console.error(error.rawValue())
                callback({
                    event: "error",
                    content: {}
                })
            },
            connectionDidFinishLoading: function (conn) {

            },
            sendRequestWithDelegate: function (address) {
                let url = $objc("NSURL").$URLWithString(`http://${address}/logs`)
                let request = $objc("NSURLRequest").$requestWithURL_cachePolicy_timeoutInterval(url, 0, 30)
                $objc("NSURLConnection").$alloc().$initWithRequest_delegate_startImmediately(request, self, true)
                // conn.$start()
            }
        }
    });

    $objc("ChunkController").$alloc().$init().$sendRequestWithDelegate(address)
}