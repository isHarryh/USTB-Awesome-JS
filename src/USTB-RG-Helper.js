// ==UserScript==
// @name         USTB RG Helper
// @version      0.5
// @description  北京科技大学锐格实验平台辅助工具
// @author       Harry Huang
// @license      MIT
// @match        *://ucb.ustb.edu.cn/*
// @run-at       document-body
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @source       https://github.com/isHarryh/USTB-Awesome-JS
// @namespace    http://ucb.ustb.edu.cn/
// ==/UserScript==

(function() {
    'use strict';

    // Optimize webpage style
    GM_addStyle(`
        /* USTH RG Helper */
        /* Header */
        .c_pic img {
            width: unset !important;
        }
        .container_header {
            height: 50px !important;
        }
        .logo {
            padding-top: 0 !important;
        }
        .nav {
            left: 250px !important;
            top: 5px !important;
        }
        .nav li a {
            height: 35px !important;
            padding-top: 10px !important;
        }
        /* Footer */
        #outter {
            padding: 0 !important;
        }
        .buttom {
            height: auto !important;
            padding: 10px 0 !important;
            position: unset !important;
        }
        .buttom pre {
            text-wrap: balance;
            word-break: break-word;
        }
        /* Content */
        pre {
            background: #fff6 !important;
            font-family: consolas, monaco !important;
            margin: 5px 0 !important;
            padding: 10px !important;
        }
        .article, .article1, .article2, .article3 {
            border-radius: 10px !important;
            margin: 5px 0 !important;
            padding: 10px !important;
        }
        #exercise_submit {
            display: grid !important;
        }
        .zTreeDemoBackground {
            width: inherit !important;
            height: 75vh !important;
        }
        .ztree {
            width: inherit !important;
            height: inherit !important;
        }
        .exercise_date {
            color: #888;
            padding: 5px 0;
        }
        #rghRelTime {
            color: #44c;
            padding: 0 5px;
        }
        .rg-log {
            color: #fff;
            margin: 5px;
            text-align: center;
        }
        .rg-log-info {
            color: #eee;
        }
        .rg-log-warn {
            color: #dd0;
        }
        .rg-log-error {
            color: #c00;
        }
        .btn {
            transition: translate 0.2s !important;
        }
        .btn:hover {
            translate: 0 -2.5px !important;
        }
        .mgt15, .mgt20, .mgt30 {
            margin-top: 12.5px !important;
        }
    `);

    // Enable text selecting
    $(document).ready(() => {
        $('body').append(`
            <script type="text/javascript" name="ustb-rg-helper">
                $('body').unbind('contextmenu');
                $(document).unbind('selectstart');
                console.log("USTB RG Helper ready");
            </script>
        `);
    });

    class DateTimeHelper {
        static toRelTime(dateString) {
            const SECOND = 1,
                  MINUTE = 60 * SECOND,
                  HOUR = 60 * MINUTE,
                  DAY = 24 * HOUR,
                  WEEK = 7 * DAY,
                  LONG_TIME = 10 * WEEK;

            const diffSec = Math.round((new Date(`${dateString} 23:59:59`) - new Date()) / 1000);
            const diffSecAbs = Math.abs(diffSec);
            const isLater = diffSec > 0;
            const suffix = isLater ? '后' : '前';

            if (diffSecAbs < MINUTE) {
                return isLater ? '刚刚' : "现在";
            } else if (diffSecAbs < HOUR) {
                const m = Math.floor(diffSecAbs / MINUTE);
                return `${m}分${suffix}`;
            } else if (diffSecAbs < DAY) {
                const h = Math.floor(diffSecAbs / HOUR);
                const m = Math.floor((diffSecAbs % HOUR) / MINUTE);
                return `${h}小时${m > 0 ? m + '分' : ''}${suffix}`;
            } else if (diffSecAbs < WEEK) {
                const d = Math.floor(diffSecAbs / DAY);
                const h = Math.floor((diffSecAbs % DAY) / HOUR);
                return `${d}天${h > 0 ? h + '小时' : ''}${suffix}`;
            } else if (diffSecAbs < LONG_TIME) {
                const w = Math.floor(diffSecAbs / WEEK);
                const d = Math.floor((diffSecAbs % WEEK) / DAY);
                return `${w}周${d > 0 ? d + '天' : ''}${suffix}`;
            } else {
                return `'很久以${suffix}`;
            }
        }

        static showRelTimeOnArticle() {
            const title = $('#nodeTitle');
            const display = $('#done_time').find('.exercise_date');
            const displayInner = $('#rghRelTime');
            if (title !== null && display !== null) {
                const nodeData = QuestionTree.getNodeFromName(title.text());
                if (nodeData !== null && nodeData.type === 'exercise') {
                    let text = "";
                    if (nodeData.timeOpen) {
                        text += `${DateTimeHelper.toRelTime(nodeData.timeOpen)}开始`;
                    }
                    if (nodeData.timeClose) {
                        if (nodeData.timeOpen) {
                            text += "，";
                        }
                        text += `${DateTimeHelper.toRelTime(nodeData.timeClose)}截止`;
                    }

                    const displayInnerNew = $(`<span id="rghRelTime" style="display:none">${text}</span>`);
                    if (displayInner.text() !== displayInnerNew.text() || displayInner === null) {
                        if (displayInner !== null) {
                            displayInner.remove();
                        }
                        display.append(displayInnerNew);
                        displayInnerNew.fadeIn();
                    }
                }
            }
        }
    }

    class QuestionLoad {
        static load = null;
        static answer = null;

        static updateLoad(newLoad) {
            QuestionLoad.load = QuestionTree.getNodeFromRealId(newLoad.currentEid);
            QuestionLoad.answer = null;
            if (QuestionLoad.load) {
                const nodeData = QuestionLoad.load;
                Logger.info(`题目详情加载完成（实际ID：${nodeData.realId}，章节：${nodeData.sectionId}）`);
            } else {
                console.warn("Not parsed question load");
            }
        }

        static updateAnswer(nodeData, content) {
            QuestionLoad.answer = {
                realId: nodeData.realId,
                sectionId: nodeData.sectionId,
                content: content
            };
            if (content) {
                Logger.info(`参考答案获取完成（实际ID：${nodeData.realId}，章节：${nodeData.sectionId}）`);
            }
        }

        static ensureToolBar() {
            const wrapper = $('#exercise_submit');
            if (!$('#rghToolBar').length && wrapper.length) {
                const toolBar = $(`
                    <div id="rghToolBar" class="mgt10 bold" style="display:none">
                        <div class="fl clearfix mgt20">
                            <a submitbtn="1" class="f_button4 btn" id="rghForceSubmit">强制提交</a>
                            &nbsp;
                            <a class="f_button4 btn" id="rghForceShowAnswer">强制显示答案</a>
                        </div>
                    </div>
                `);
                toolBar.find('#rghForceShowAnswer').click(() => {
                    $('#rghAnswerDisplay').slideToggle();
                    QuestionLoad.showForceAnswer();
                });
                const answerDisplay = $(`
                    <div id="rghAnswerDisplay" style="display:none">
                        <div class="bold mgt30">参考答案:</div>
                        <div class="mgt10 article bluebg scroll">
                            <pre></pre>
                        </div>
                    </div>
                `);
                wrapper.append(toolBar);
                wrapper.append(answerDisplay);
                toolBar.slideDown();
            }
        }

        static showForceSubmit() {
            const nodeData = QuestionLoad.load;
            if (nodeData) {
                QuestionLoad.ensureToolBar();
                const btn = $('#rghForceSubmit');
                if (btn.length) {
                    // Question type: 0=Selection, 1=FillIn, 2=Program
                    switch (nodeData.exerciseType) {
                        case '0':
                            btn.prop('href', `javascript:submitSel(${nodeData.realId},0,0,${nodeData.sectionId})`);
                            break;
                        case '1':
                            btn.prop('href', `javascript:submitFill(${nodeData.realId},0,0,${nodeData.sectionId})`);
                            break;
                        case '2':
                            btn.prop('onclick', `return setmyselflanguage();`);
                            btn.prop('href', `javascript:submitPrg(${nodeData.realId},0,0,${nodeData.sectionId})`);
                            break;
                        default:
                            return;
                    }
                }
            }
        }

        static showForceAnswer() {
            const nodeData = QuestionLoad.load;
            const answerDisplay = $('#rghAnswerDisplay');
            const answerDisplayPre = answerDisplay.find('pre');
            if (nodeData && answerDisplay.length && answerDisplayPre.length) {
                if (!QuestionLoad.isCurrentLoadNode(QuestionLoad.answer)) {
                    answerDisplayPre.html("正在获取参考答案...");

                    const finalNodeData = JSON.parse(JSON.stringify(nodeData));
                    QuestionLoad.updateAnswer(finalNodeData, null);

                    XHRSender.get(
                        `http://ucb.ustb.edu.cn/studentHome/popup?type=key&id=${finalNodeData.realId}&c_a_r=1&section_id=${finalNodeData.sectionId}&sign=0`,
                        (data) => {
                            if (!QuestionLoad.isCurrentLoadNode(finalNodeData)) {
                                console.log("Answer response fetched but node changed");
                                return;
                            }
                            QuestionLoad.ensureToolBar();
                            QuestionLoad.updateAnswer(finalNodeData, null);

                            const parsedHtml = $('<section>').append(data);
                            let answerDiv;
                            let answerStr;
                            if ((answerDiv = parsedHtml.find('#div_box_2')).length) {
                                // Answer string in common div
                                answerStr = answerDiv.html();
                                answerStr = QuestionLoad.trimStringAlt(answerStr);
                                QuestionLoad.updateAnswer(finalNodeData, answerStr);
                            } else if ((answerDiv = parsedHtml.find('#div_box_1')).length) {
                                // Answer string in embedded script
                                const jsVarMatch = /var\s+init_obj\s*=\s*(.+);/g.exec(parsedHtml.html());
                                if (jsVarMatch !== null) {
                                    const jsContentMatch = /['"]content['"]\s*:\s*['"](.+)['"]\s*,\s*['"]courseLang['"]\s*:/g.exec(jsVarMatch[1]);
                                    if (jsContentMatch !== null) {
                                        answerStr = jsContentMatch[1];
                                        answerStr = QuestionLoad.decodeRawJSONString(answerStr);
                                        answerStr = QuestionLoad.trimString(answerStr);
                                        QuestionLoad.updateAnswer(finalNodeData, answerStr);
                                    }
                                }
                            } else {
                                console.warn("Unknown answer response");
                            }

                            // Add answer content to answer display element
                            answerDisplayPre.html(QuestionLoad.answer.content);

                            // Add a copy button
                            const copyBtn = $(`<a class="f_button4 btn" style="font-weight:bold">复制</a>`);
                            copyBtn.click(() => {
                                const textArea = $(`<textarea style='position:absolute;top:-9999px;left:-9999px;z-index:-9999'>`);
                                $('body').append(textArea);
                                textArea.val(answerDisplayPre.text()).select();
                                try {
                                    // Non-HTTPS website cannot use clipboard API, use legacy command instead
                                    if (document.execCommand('copy')) {
                                        copyBtn.text("复制成功");
                                        Logger.info("参考答案已复制到剪贴板");
                                    } else {
                                        throw Error("Unable to execute copy command");
                                    }
                                } catch (err) {
                                    copyBtn.text("复制失败");
                                    console.warn("Unable to execute copy command");
                                }
                                textArea.remove();
                            });
                            answerDisplay.append(copyBtn);
                        }
                    );
                }
            }
        }

        static trimString(str) {
            return str.trim();
        }

        static trimStringAlt(str) {
            return str.trim().replaceAll('<br>\n', '\n').replaceAll('\n<br>', '\n');
        }

        static decodeRawJSONString(str) {
            return JSON.parse(`"${str.replaceAll('\"', '\\\"')}"`);
        }

        static isCurrentLoadNode(nodeData) {
            if (!nodeData || !QuestionLoad.load)
                return false;
            return nodeData.realId == QuestionLoad.load.realId && nodeData.sectionId == QuestionLoad.load.sectionId;
        }
    }

    class QuestionTree {
        static nodes = {}

        static updateNodes(newNodes) {
            newNodes.forEach((e) => {
                QuestionTree.nodes[e.realId] = ({
                    name: e.name,
                    type: e.type,
                    realId: e.realId,
                    sectionId: e.section_id,
                    exerciseType: e.etype,
                    timeOpen: e.start_time,
                    timeClose: e.done_time
                })
            });
            Logger.info("节点列表加载完成（节点数量：" + Object.entries(newNodes).length + "）");
        }

        static getNodeFromName(name) {
            for (const [id, data] of Object.entries(this.nodes)) {
                if (data.name == name) {
                    return data;
                }
            }
            return null;
        }

        static getNodeFromRealId(realId) {
            for (const [id, data] of Object.entries(this.nodes)) {
                if (data.realId == realId) {
                    return data;
                }
            }
            return null;
        }
    }

    class Logger {
        static title = "RGHelper";

        static showStatusBar() {
            if ($('#rgLogContent').length === 0) {
                $('.buttom').empty();
                $('.buttom').append(`
                <p class="rg-log">
                    <span class="bold">已启用 USTB RG Helper</span>
                    <pre id="rgLogContent" class="rg-log-info"></pre>
                </p>
                `);
            }
        }

        static info(msg) {
            console.log("[" + Logger.title + "]", msg);
            $('#rgLogContent').text(msg);
        }
    }

    class XHRSender {
        static get(url, callback) {
            $.ajax({
                type: 'GET',
                url: url,
                async: true,
                beforeSend: (xhr) => {},
                success: (data, status, xhr) => {
                    callback(data);
                },
                error: (xhr, options, err) => {
                    console.error("Request sending failed", e)
                }
            });
        }
    }

    class XHRSpy {
        static listeners = [];
        static originalSend = XMLHttpRequest.prototype.send;
        static replacedSend = XMLHttpRequest.prototype.send = function(...args) {
            const xhr = this;
            xhr.addEventListener('readystatechange', () => XHRSpy.listeners.forEach((l) => l(xhr)));
            return XHRSpy.originalSend.apply(xhr, args);
        };

        static add(pathNamePrefix, handler) {
            XHRSpy.listeners.push(function(xhr) {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    let url = new URL(xhr.responseURL);
                    if (url.pathname.startsWith(pathNamePrefix)) {
                        let json;
                        try {
                            json = JSON.parse(xhr.responseText);
                        } catch (err) {
                            console.error("Response parsing failed", err);
                        }
                        try {
                            handler(json, url);
                        } catch (err) {
                            console.error("Response handling failed", err);
                        }
                    }
                }
            });
        }
    }

    // Listen on nodes updates
    XHRSpy.add('/studentExercise/ajaxGetNodes', (data, url) => {
        QuestionTree.updateNodes(data);
    });

    // Listen on question loading responses
    XHRSpy.add('/studentExercise/ajaxLoad', (data, url) => {
        QuestionLoad.updateLoad(data);
    });

    setInterval(() => {
        DateTimeHelper.showRelTimeOnArticle();
        QuestionLoad.showForceSubmit();
        Logger.showStatusBar();
    }, 500);

})();
