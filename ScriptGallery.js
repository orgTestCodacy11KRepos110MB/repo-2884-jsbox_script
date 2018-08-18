const screenWidth = $device.info.screen.width

function render(statusHeight) {
    $ui.render({
        props: {
            id: "bodyView",
            title: "",
            statusBarStyle: 1,
            navBarHidden: true
        },
        views: [{
            type: "view",
            props: {
                bgcolor: $color("#343a40")
            },
            layout: (make, view) => {
                make.height.equalTo(view.super);
                make.width.equalTo(view.super);
            },
            views: [{
                type: "label",
                props: {
                    text: "Loading...",
                    font: $font(30),
                    color: $color("white"),
                    align: $align.center
                },
                layout: $layout.center
            }]
        }, {
            type: "web",
            props: {
                alpha: 0,
                id: "webView",
                showsProgress: false,
                bounces: false,
                canGoForward: true,
                url: "https://xteko.com/gallery",
                inlineMedia: true,
                pictureInPicture: true,
                script: () => {
                    window.onload = function () {
                        fetch("https://xteko.com/store/meta?lang=" + $0).then(function (n) {
                            return n.json()
                        }).then(function (n) {
                            $3 = n.result;
                            $5()
                        }).then(_ => {
                            addOnClickHandler()
                        })
                    };

                    function $10(n) {
                        var t = $3.map(function (n) {
                            return n.category
                        });
                        if (t.indexOf(n) === -1) {
                            $4 = null
                        } else {
                            $4 = n
                        }
                        $5()
                        addOnClickHandler()
                    }

                    function addOnClickHandler() {
                        let cards = document.getElementsByClassName("card-text addin-text");
                        for (var i = 0; i < cards.length; ++i) {
                            var element = cards[i];
                            element.onclick = event => {
                                var source = event.target || event.srcElement
                                $notify("cardClick", source.innerText)
                                return false
                            }
                        }
                        let btns = document.getElementsByClassName("btn btn-primary addin-btn");
                        for (var i = 0; i < btns.length; ++i) {
                            var element = btns[i];
                            element.onclick = event => {
                                var source = event.target || event.srcElement
                                $notify("hrefClick", source.href)
                                return false
                            }
                        }
                    }

                    let navItems = document.getElementsByClassName("nav-item");
                    navItems[0].parentNode.removeChild(navItems[0])
                    navItems[0].parentNode.removeChild(navItems[0])

                    function sayHi(str) {
                        alert(str)
                    }
                }
            },
            layout: (make, view) => {
                make.height.equalTo(view.super).offset(-statusHeight);
                make.width.equalTo(view.super)
                make.top.equalTo(view.super).offset(statusHeight)
            },
            events: {
                hrefClick: async href => {
                    let resp = await $http.get({
                        url: href,
                        header: {
                            "USER-AGENT": "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1"
                        }
                    });
                    let urlMatcher = resp.data.match(/(jsbox:\/\/install.*?)'/)
                    if (urlMatcher && urlMatcher[1]) {
                        $app.openURL(urlMatcher[1]);
                    }
                },
                cardClick: text => {
                    showAlterDialog(text)
                    $("webView").notify('sayHi', 'shit')
                },
                didFinish: function (sender, navigation) {
                    $ui.animate({
                        duration: 0.3,
                        animation: function () {
                            $("webView").alpha = 1
                        }
                    });
                }
            }
        }]
    });
}

function showAlterDialog(content) {
    let fontSize = $text.sizeThatFits({
        text: content,
        width: screenWidth - 70,
        font: $font("bold", 16)
    })
    let view = {
        type: "blur",
        layout: $layout.fill,
        props: {
            id: "alertBody",
            style: 1,
            alpha: 0
        },
        views: [{
            type: "view",
            props: {
                bgcolor: $color("#343a40"),
                smoothRadius: 8
            },
            layout: (make, view) => {
                make.height.equalTo(90 + fontSize.height);
                make.width.equalTo(view.super).offset(-30);
                make.center.equalTo(view.super)
            },
            events: {
                tapped: sender => { }
            },
            views: [{
                type: "label",
                props: {
                    text: "脚本简介",
                    textColor: $color("white"),
                    font: $font("bold", 16)
                },
                layout: (make, view) => {
                    make.top.equalTo(view.super).offset(20);
                    make.centerX.equalTo(view.super)
                }
            }, {
                type: "text",
                props: {
                    text: content,
                    autoFontSize: true,
                    radius: 6,
                    font: $font("bold", 16),
                    bgcolor: $color("#fff"),
                    insets: $insets(10, 5, 10, 5)
                },
                events: {
                    returned: sender => {
                        sender.blur()
                    }
                },
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(10);
                    make.width.equalTo(view.super).offset(-20);
                    make.centerX.equalTo(view.super)
                    make.left.equalTo(view.super).offset(10);
                    make.height.equalTo(fontSize.height + 20)
                }
            }]
        }],
        events: {
            tapped: sender => {
                sender.remove()
            }
        }
    }
    $("bodyView").add(view)
    $ui.animate({
        duration: 0.2,
        animation: () => {
            $("alertBody").alpha = 1
        }
    })
}

let statusRect = $objc("UIApplication").$sharedApplication().$statusBarFrame();

render(statusRect.height)
