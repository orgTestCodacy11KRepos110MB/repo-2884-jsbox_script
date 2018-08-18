window.onclick = e => {
                        let target = e.target;
                        let href = target.href;
                        $notify("hrefClick", href)
                    }
