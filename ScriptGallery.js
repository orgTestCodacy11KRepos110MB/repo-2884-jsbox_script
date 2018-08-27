const socketLogger = require('socketLogger')
'init' in socketLogger && socketLogger.init('192.168.50.229')

const screenWidth = $device.info.screen.width

const isIphoneX = $device.isIphoneX

const CN_MENU = ['最新', '精选', '文本', '工具', '开发者', '生活', '服务', '娱乐', '图片', 'Safari']
const EN_MENU = ['New', 'Featured', 'Text', 'Utility', 'Developer', 'Life', 'Service', '4Fun', 'Image', 'Safari']

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
                    font: $font("ChalkboardSE-Light", 30),
                    color: $color("white"),
                    align: $align.center
                },
                layout: $layout.center
            }]
        }, {
            type: "menu",
            props: {
                id: "menuView",
                alpha: 0,
                items: CN_MENU,
                bgcolor: $color("#fff")
            },
            layout: (make, view) => {
                make.bottom.equalTo(view.super).offset(-(isIphoneX ? 48 : 0));
                make.height.equalTo(44)
                make.width.equalTo(view.super);
            },
            events: {
                changed: sender => {
                    let items = sender.items
                    let idx = sender.index
                    $("webView").eval({
                        script: `$10('${items[idx]}')`
                    })
                }
            }
        }, {
            type: "web",
            props: {
                alpha: 0,
                id: "webView",
                showsProgress: false,
                bounces: false,
                canGoForward: true,
                url: "https://xteko.com/gallery",
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
                        let parentCard = document.getElementsByClassName("content-table-mobile")[0];
                        parentCard.addEventListener('click', e => {
                            let target = e.target
                            if (target.className === 'btn btn-primary addin-btn') {
                                $notify("hrefClick", target.href)
                                e.stopPropagation()
                                return false
                            }
                        }, true)
                        let cards = document.getElementsByClassName("card-body item-body");
                        for (var i = 0; i < cards.length; ++i) {
                            var element = cards[i];
                            element.addEventListener('click', e => {
                                var source = e.currentTarget
                                $notify("cardClick", source.innerHTML)
                                return false
                            })
                        }

                        let catMenu = document.getElementById("category-menu");
                        catMenu.style.display = "none"

                    }

                    let navItems = document.getElementsByClassName("nav-item");
                    navItems[0].parentNode.removeChild(navItems[0])
                    navItems[0].parentNode.removeChild(navItems[0])

                    navItems[0].addEventListener('click', e => {
                        $notify("switchLng", e.target.href)
                    })

                }
            },
            layout: (make, view) => {
                make.height.equalTo(view.super).offset(-statusHeight - 44 - (isIphoneX ? 48 : 0));
                make.width.equalTo(view.super)
                make.top.equalTo(view.super).offset(statusHeight)
            },
            events: {
                hrefClick: async href => {
                    console.log('href', href);
                    let resp = await $http.get({
                        url: href,
                        header: {
                            "USER-AGENT": "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1"
                        }
                    });
                    let urlMatcher = resp.data.match(/(jsbox:\/\/.*?)'/)
                    if (urlMatcher && urlMatcher[1]) {
                        $app.openURL(urlMatcher[1]);
                    }
                },
                cardClick: async html => {
                    let titleMatcher = html.match(/addin-title">(.*?)<\/span/)
                    let descMatcher = html.match(/card-text addin-text">([\s\S]*?)<\/p>/)
                    let urlMatcher = html.match(/href="(.*?)"/)
                    if (titleMatcher && titleMatcher[1] && descMatcher && descMatcher[1] && urlMatcher && urlMatcher[1]) {
                        let shortenUrl = await $http.shorten(urlMatcher[1])
                        showAlterDialog(titleMatcher[1], descMatcher[1], shortenUrl)
                    }
                },
                didFinish: function (sender, navigation) {
                    $ui.animate({
                        duration: 0.3,
                        animation: function () {
                            $("webView").alpha = 1
                            $("menuView").alpha = 1
                            $("emptyView").alpha = 1
                        }
                    });
                },
                switchLng: href => {
                    $("menuView").items = /\/en$/.test(href) ? EN_MENU : CN_MENU
                    $("menuView").index = 0
                }
            }
        }, {
            type: "view",
            props: {
                id: "emptyView",
                bgcolor: $color("#eff0f2"),
                hidden: !isIphoneX,
                alpha: 0
            },
            layout: (make, view) => {
                make.height.equalTo(48);
                make.bottom.equalTo(0);
                make.width.equalTo(view.super);
            }
        }]
    });
}


function showAlterDialog(title, content, url) {
    let fontSize = $text.sizeThatFits({
        text: content,
        width: screenWidth - 70,
        font: $font(16)
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
                smoothRadius: 8,
                id: "detailShareView"
            },
            layout: (make, view) => {
                make.height.equalTo(170 + fontSize.height);
                make.width.equalTo(view.super).offset(-30);
                make.centerX.equalTo(view.super)
                make.centerY.equalTo(view.super).offset(-25)
            },
            events: {
                tapped: sender => { }
            },
            views: [{
                type: "label",
                props: {
                    text: `${title}`,
                    textColor: $color("white"),
                    font: $font("bold", 20)
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
                    font: $font(16),
                    bgcolor: $color("#fff"),
                    insets: $insets(10, 5, 10, 5),
                    editable: false,
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
            }, {
                type: 'image',
                layout: (make, view) => {
                    make.top.equalTo(view.prev.bottom).offset(10);
                    make.size.equalTo($size(70, 70));
                    make.left.equalTo(view.super).offset(10)
                },
                props: {
                    smoothRadius: 5,
                    data: $qrcode.encode(url).png
                }
            }, {
                type: 'label',
                layout: (make, view) => {
                    make.top.equalTo(view.prev);
                    make.height.equalTo(70)
                    make.right.equalTo(view.super).offset(-10)
                },
                props: {
                    text: "Powered by JSBox",
                    textColor: $color("#ccc"),
                    font: $font("Chalkduster", 18)
                }
            }]
        }, {
            type: "button",
            props: {
                icon: $icon("022", $color("#343a40"), $size(30, 30)),
                bgcolor: $color("clear")
            },
            layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(20)
                make.centerX.equalTo(view.super)
            },
            events: {
                tapped: sender => {
                    let snapShot = $("detailShareView").snapshot
                    $share.sheet([snapShot]);
                }
            }
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
