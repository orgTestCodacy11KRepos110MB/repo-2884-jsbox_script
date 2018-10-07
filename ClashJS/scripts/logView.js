

module.exports.render = (address) => {


    $define({
        type: "Chunk: NSURLConnectionDataDelegate",
        events: {
            "didReceiveData": function(data) {
                console.log(data)
            }
        }
    })

    console.log('add', address)


    let url = NSURL.$URLWithString(`http://${address}/configs`)
    console.log('url', url);
    let request = $objc("NSURLRequest").$requestWithURL(url)
    console.log('request', request);
    let conn = $objc("Chunk").$initWithRequest_delegate_startImmediately(request, this, true)
    console.log('heloo', conn)

}



