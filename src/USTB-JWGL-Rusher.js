// ==UserScript==
// @name         USTB JWGL Rusher
// @version      0.2
// @description  北京科技大学本科生抢课工具
// @author       Harry Huang
// @license      MIT
// @match        *://jwgl.ustb.edu.cn/xsxk/xsxkzx_zy*
// @run-at       document-body
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @source       https://github.com/isHarryh/USTB-Awesome-JS
// @namespace    https://jwgl.ustb.edu.cn/
// ==/UserScript==

(function() {
    'use strict';

    // Optimize webpage style
    GM_addStyle(`
#jwgl-rusher {
    width: 38.2%;
    display: flex;
    padding: 10px;
    position: absolute;
    flex-direction: column;
    align-items: center;
}

#jwgl-rusher .bg {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    position: absolute;
    background-color: #eeec;
    backdrop-filter: blur(2.5px);
    border-radius: 10px;
    box-shadow: 0 0 7.5px 5px #0004;
    z-index: 0;
}

#jwgl-rusher .component {
    width: 90%;
    max-height: 25vh;
    margin: 10px 0;
    padding: 15px;
    background-color: #fff;
    border: 1px solid #bde;
    border-radius: 5px;
    box-shadow: 2.5px 5px 5px 0 #0002;
    overflow: overlay;
    z-index: 1;
}

#jwgl-rusher h2 {
    margin: 10px 0 5px 0;
    color: #069;
    font-size: 1.4em;
    text-align: center;
    z-index: 1;
    user-select: none;
}

#jwgl-rusher .component h3 {
    margin: 0 0 10px 0;
    color: #069;
    font-size: 1.2em;
    text-align: left;
    z-index: 1;
}

#jwgl-rusher .footer {
    color: #888;
    font-size: 0.8em;
    text-align: center;
    z-index: 1;
}

#jwgl-rusher .component>div {
    margin-top: 5px;
}

#jwgl-rusher .tip {
    padding: 5px 0;
    color: #444;
    text-align: center;
}

#jwgl-rusher table {
    width: 100%;
    border-collapse: collapse;
}

#jwgl-rusher th,
#jwgl-rusher td {
    padding: 5px;
    border: 1px solid #bde;
    text-align: center;
}

#jwgl-rusher th {
    background-color: #eff;
}

#jwgl-rusher label {
    margin-right: 10px;
}

#jwgl-rusher select {
    padding: 5px;
    border: 1px solid #bde;
    border-radius: 5px;
}

#jwgl-rusher ul {
    list-style-type: disc;
    margin-left: 20px;
    padding-left: 0;
}

#jwgl-rusher button {
    padding: 5px 10px;
    background-color: #fff;
    border: 1px solid #bde;
    border-radius: 5px;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
    z-index: 1;
}

#jwgl-rusher button:hover {
    background-color: #eee;
}

#jwgl-rusher button:disabled {
    background-color: #ddd;
    cursor: not-allowed;
}
`);

    const apiXsxkOper = "https://jwgl.ustb.edu.cn/xsxk/xsxkoper";

    class GUIPane {
        static $pane = null;

        static init() {
            const $pane = $(`
<div id="jwgl-rusher">
    <div id="jwgl-rusher-header" class="bg"></div>
    <h2>USTB JWGL Rusher</h2>

    <div class="component">
        <h3>讲台看板</h3>
        <table id="qkTable">
            <thead>
                <tr>
                    <th>序号</th>
                    <th>课程</th>
                    <th>教师</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <p class="tip">点击任意课程以获取讲台列表</p>
    </div>

    <div class="component">
        <h3>抢课状态</h3>
        <div>
            <span>延迟：</span>
            <span id="qkLatency">--</span>
            <button id="qkStop" style="float:right">停止</button>
        </div>
        <div>
            <span>响应：</span>
            <ul id="qkLog"></ul>
        </div>
    </div>

    <div class="component">
        <h3>抢课设置</h3>
        <div>
            <label for="qkFrequency">请求频率：</label>
            <select id="qkFrequency">
                <option value="1000">每秒 1 次</option>
                <option value="500">每秒 2 次</option>
                <option value="333">每秒 3 次</option>
                <option value="250">每秒 4 次</option>
                <option value="200" selected>每秒 5 次</option>
                <option value="167">每秒 6 次</option>
                <option value="125">每秒 8 次</option>
                <option value="100">每秒 10 次</option>
            </select>
        </div>
    </div>

    <p class="footer">Source: https://github.com/isHarryh/USTB-Awesome-JS</p>
</div>
`);
            $('body').append($pane);

            LoopRequester.interval = parseInt($('#qkFrequency').val(), 10);
            $('#qkFrequency').on('change', function() {
                var newInterval = parseInt($(this).val(), 10);
                LoopRequester.interval = newInterval;
                console.log("🆗 Set interval to " + newInterval + " ms.");
            });
            $('#qkStop').on('click', () => {
                LoopRequester.stop();
                $('#qkFrequency').prop('disabled', false);
                console.log("🚩 Stop loop request.");
            });

            GUIPane.makeDraggable($pane, 10, 10);
            GUIPane.$pane = $pane;
        }

        static updateTable(classes, params) {
            const $table = $('#qkTable');
            const $tbody = $table.find('tbody');
            $tbody.empty();

            $.each(classes, function(idx, item) {
                // 表格列：序号-课程-教师-操作
                const $tr = $('<tr></tr>');
                $('<td></td>').text(item.order).appendTo($tr);
                $('<td></td>').text(item.className).appendTo($tr);
                $('<td></td>').text(item.teacherName).appendTo($tr);
                // 断言 params 包含指定字段
                const isUndefined = (v) => {
                    return v === undefined;
                };
                if (
                    isUndefined(params) &&
                    isUndefined(params.dqjx0502zbid) &&
                    isUndefined(params.jx02id) &&
                    isUndefined(params.type) &&
                    isUndefined(params.kcfalx) &&
                    isUndefined(params.xsid) &&
                    isUndefined(params.opener) &&
                    isUndefined(params.sfzybxk)
                ) {
                    console.warn("❗ Params missing.");
                    return;
                }
                // 抢课按钮逻辑
                const $btn = $('<button></button>')
                    .text('抢课')
                    .on('click', () => {
                        if (!confirm("是否确认开始抢课？")) {
                            return;
                        }
                        // 构造选课请求
                        let real_params = {
                            jx0404id: item.classId, // 讲台 ID
                            dqjx0502zbid: params.dqjx0502zbid, // 选课轮次 ID
                            yjx02id: params.jx02id, // 课程 ID
                            xdlx: "1",
                            jx02id: params.jx02id, // 课程 ID
                            type: params.type, // 课程类型
                            kcfalx: params.kcfalx,
                            xsid: params.xsid,
                            opener: params.opener,
                            sfzybxk: params.sfzybxk,
                            qzxkkz: "0",
                            glyxk: "0"
                        };
                        $('#qkFrequency').prop('disabled', true);
                        console.log("🚀 Start for loop request. Params:", real_params);
                        LoopRequester.start(apiXsxkOper, real_params);
                    });
                $('<td></td>').append($btn).appendTo($tr);
                $tbody.append($tr);
                $('#jwgl-rusher .tip').hide();
            });
        }

        static updateStatus(session) {
            // 第一步：更新延迟状态
            const $latency = $("#qkLatency");
            const now = new Date().getTime();
            // 若 lastResponseAt 不存在，则认为未收到响应
            const last = session.lastResponseAt ? new Date(session.lastResponseAt).getTime() : 0;
            const delay = now - last;

            let statusText = "";
            if (!session.meta || last <= 0) {
                statusText = "⚪--";
            } else if (delay < 300) {
                statusText = "🟢流畅";
            } else if (delay < 600) {
                statusText = "🟡一般";
            } else if (delay < 900) {
                statusText = "🟠缓慢";
            } else {
                statusText = "🔴阻滞";
                if (delay < 999.9 * 1000) {
                    statusText += "（无响应已持续 " + (delay / 1000).toFixed(1) + " 秒）";
                }
            }
            $latency.text(statusText);

            // 第二步：显示响应历史记录
            const $qkLog = $("#qkLog");
            $qkLog.empty();
            $.each(session.responseMap, function(message, count) {
                const itemText = "收到 " + count + " 次： " + message;
                $("<li></li>").text(itemText).appendTo($qkLog);
            });
        }

        static makeDraggable($ele, initX, initY) {
            // https://www.w3schools.com/howto/howto_js_draggable.asp

            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

            $ele.css({
                top: initY,
                left: initX
            });

            const dragMove = (e) => {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                $ele.css({
                    top: $ele.position().top - pos2,
                    left: $ele.position().left - pos1
                });
            }

            const dragFinish = (e) => {
                $(document).off('mouseup', dragFinish);
                $(document).off('mousemove', dragMove);
            }

            const dragMouseDown = (e) => {
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                $(document).on('mouseup', dragFinish);
                $(document).on('mousemove', dragMove);
            }

            let $header = $("#" + $ele.attr('id') + "-header");
            if ($header.length) {
                $header.on('mousedown', dragMouseDown);
            } else {
                $ele.on('mousedown', dragMouseDown);
            }
        }
    }

    class LoopRequester {
        static session = {
            meta: {
                url: null, // GET 请求 URL（字符串）
                params: null, // GET 请求的查询字符串参数（对象）
            },
            lastResponseAt: null, // 上次收到响应的时间
            responseMap: {}, // 响应的历史记录（响应的 message 字段=>出现的次数）
            hasSuccess: false // 是否出现过 success 字段为真的响应
        }

        static interval = 200; // 两次请求的间隔（毫秒）
        static loopId = null; // 用于存储当前的 setInterval ID

        // 启动请求循环
        static start(url, params) {
            // 将类静态成员 session 重置
            LoopRequester.session = {
                meta: {
                    url: url,
                    params: params
                },
                lastResponseAt: null,
                responseMap: {},
                hasSuccess: false
            };

            // 确保没有循环链正在运行
            if (LoopRequester.loopId !== null) {
                clearInterval(LoopRequester.loopId);
            }

            // 定义响应处理函数
            const onResponse = (raw) => {
                if (!LoopRequester.session.meta) {
                    return;
                }
                let rsp = JSON.parse(raw);
                // 记录响应时间
                LoopRequester.session.lastResponseAt = new Date();
                // 更新历史记录
                if (rsp.success === undefined && rsp.flag1 !== undefined) {
                    rsp.message = "登录可能已失效，请重新进入";
                }
                if (rsp.message in LoopRequester.session.responseMap) {
                    LoopRequester.session.responseMap[rsp.message] += 1;
                } else {
                    LoopRequester.session.responseMap[rsp.message] = 1;
                }
                // 检查是否有 success 字段且值为 true
                if (rsp.success === true || rsp.success === '1' || rsp.success === 1) {
                    LoopRequester.session.hasSuccess = true;
                }
            };

            // 立即执行首次请求
            $.get(url, params, onResponse);

            // 启动循环链
            LoopRequester.loopId = setInterval(function() {
                // 检查 meta 字段是否发生变化
                if (
                    !LoopRequester.session.meta ||
                    LoopRequester.session.meta.url !== url ||
                    JSON.stringify(LoopRequester.session.meta.params) !== JSON.stringify(params)
                ) {
                    LoopRequester.stop(); // 如果 meta 变更，停止当前循环
                    return;
                }
                // 发送请求
                $.get(url, params, onResponse);
            }, LoopRequester.interval);
        }

        // 停止请求循环
        static stop() {
            // 将类静态成员 session 重置
            LoopRequester.session = {
                meta: null,
                lastResponseAt: null,
                responseMap: {},
                hasSuccess: false
            };

            // 清除 setInterval
            if (LoopRequester.loopId !== null) {
                clearInterval(LoopRequester.loopId);
                LoopRequester.loopId = null;
            }
        }
    }


    class ClassListManager {
        static classes = {};
        static params = {};

        static updateClassList(doc) {
            // 遍历所有表格行，以获取所有讲台信息
            let classes = [];
            $(doc).find('tr').each(function() {
                try {
                    let result = {};
                    let $row = $(this);
                    if ($row.find('td').length) {
                        // 获取序号
                        result.order = $row.find('td').eq(0).text().trim();
                        // 获取课程名和分组名
                        result.className = (
                            $row.find('td').eq(3).text().replace(/\s/g, '') +
                            " " +
                            $row.find('td').eq(5).text().replace(/\s/, '')
                        ).trim();
                        // 获取教师名
                        result.teacherName = $row.find('td').eq(7).text().replace(/\s/g, '');
                        // 获取讲台 ID（提取 href 调用函数的第一个参数）
                        let classIdMatch = $row.find('td').eq(1).find('a').attr('href').match(/'([^']+)'/);
                        if (classIdMatch) {
                            result.classId = classIdMatch[1];
                        }
                        // 加入到列表
                        classes.push(result);
                    }
                } catch (e) {
                    console.log("❎ Failed to get classes, may be there are no class in the list.");
                }
            });

            // 遍历所有隐藏的 input 元素，以获取请求参数
            let params = {};
            $(doc).find('input[type="hidden"]').each(function() {
                let $input = $(this);
                params[$input.attr('name')] = $input.val();
            });

            // 转储讲台列表和参数列表
            ClassListManager.classes = classes;
            ClassListManager.params = params;
            console.log("✅ Successfully fetched classes!", classes, params);
        }
    }

    class IframeSpy {
        static listeners = [];

        static add(pathNamePrefix, handler) {
            IframeSpy.listeners.push(function(doc, url) {
                console.log("🌱 Iframe loaded: " + url);
                if (new URL(url).pathname.startsWith(pathNamePrefix)) {
                    handler(doc);
                }
            });
        }

        static startSpy() {
            $('iframe').each(function() {
                $(this).on('load', function() {
                    const doc = this.contentWindow.document;
                    const url = doc.URL;
                    IframeSpy.listeners.forEach((l) => l(doc, url));
                });
            });
        }
    }

    // Listen on iframe
    IframeSpy.add('/xsxk/getkcxxlist.do', ($iframe) => {
        ClassListManager.updateClassList($iframe);
        GUIPane.updateTable(ClassListManager.classes, ClassListManager.params);
    });
    IframeSpy.startSpy();

    // Init GUI pane
    GUIPane.init();
    setInterval(() => {
        GUIPane.updateStatus(LoopRequester.session);
    }, 150);

    console.log("USTB JWGL Rusher Start");

})();
