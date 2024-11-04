// ==UserScript==
// @name         USTB RG Helper
// @namespace    http://ucb.ustb.edu.cn/
// @version      0.3
// @description  北京科技大学锐格实验平台辅助工具
// @author       Harry Huang
// @license      MIT
// @match        *://ucb.ustb.edu.cn/*
// @run-at       document-body
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
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

    class FillInHelper {
        static apply(txt) {
            FillInHelper.showAnswer(txt);
        }

        static showAnswer(txt) {
            $('#feedbackBoxAlt').remove();
            const box = $(`
                <div id="feedbackBoxAlt">
                    <div class="bold mgt30">可能的参考答案:</div>
                    <div class="mgt10 article bluebg scroll">
                        <pre></pre>
                    </div>
                </div>
            `);
            const answerStr = FillInHelper.generatePossibleAnswer(txt);
            Logger.info("原始答案表达式：" + txt)
            box.find('pre').append(answerStr);
            $('#exercise_submit').append(box);
        }

        static generatePossibleAnswer(txt) {
            const clozePattern = /\(\^(.+?)\$\)/g;
            return txt.split(';;').map((line) => {
                return line.split(';').map((part) => {
                    let match;
                    let result = '';
                    while ((match = clozePattern.exec(part)) !== null) {
                        result += FillInHelper.generateRegexCase(match[1]);
                    }
                    return result;
                }).join(' ');
            }).join('\n');
        }

        static generateRegexCase(regex) {
            let result = '';
            let prevChar = '';
            for (let i = 0; i < regex.length; i++) {
                let char = regex[i];
                if (prevChar === '\\') {
                    switch (char) {
                        case 'd':
                            prevChar = '0';
                            break;
                        case 'w':
                            prevChar = 'a';
                            break;
                        case 's':
                            prevChar = ' ';
                            break;
                        case '.':
                            prevChar = '.';
                            break;
                        default:
                            prevChar = char;
                            break;
                    }
                } else {
                    switch (char) {
                        case '*':
                            prevChar = '';
                            break;
                        case '+':
                            result += prevChar;
                            prevChar = char;
                            break;
                        default:
                            result += prevChar;
                            prevChar = char;
                            break;
                    }
                }
            }
            result += prevChar;
            return result;
        }
    }

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
        static load = {};
        static answer = {};

        static updateLoad(newLoad) {
            QuestionLoad.load = newLoad;
            Logger.info("题目详情加载完成（实际ID："+ newLoad.currentEid +"，类型：" + newLoad.type + "）");
        }

        static showForceSubmit() {
            const finalLoad = QuestionLoad.load;
            if (finalLoad.currentEid !== null) {
                const nodeData = QuestionTree.getNodeFromRealId(finalLoad.currentEid);
                if (nodeData !== null) {
                    const btn = $('#rghForceSubmit');
                    const wrapper = $(`
                        <div class="mgt10 bold" style="display:none">
                            <div class="fl clearfix mgt20">
                                <a submitbtn="1" class="f_button4 btn" id="rghForceSubmit">强制提交</a>
                            </div>
                        </div>`
                    );
                    const btnNew = wrapper.find('#rghForceSubmit');

                    // Question type: 0=Selection, 1=FillIn, 2=Program
                    switch (finalLoad.type) {
                        case '0':
                            btnNew.prop('href', `javascript:submitSel(${nodeData.realId},0,0,${nodeData.sectionId})`);
                            break;
                        case '1':
                            btnNew.prop('href', `javascript:submitFill(${nodeData.realId},0,0,${nodeData.sectionId})`);
                            break;
                        case '2':
                            btnNew.prop('onclick', `return setmyselflanguage();`);
                            btnNew.prop('href', `javascript:submitPrg(${nodeData.realId},0,0,${nodeData.sectionId})`);
                            break;
                        default:
                            return;
                    }

                    if (btn.prop('href') !== btnNew.prop('href') || btn === null) {
                        if (btn !== null) {
                            btn.remove();
                        }
                        $('#exercise_submit').append(wrapper);
                        wrapper.fadeIn();
                    }
                }
            }
        }

        static showForceAnswer() {
            const finalLoad = QuestionLoad.load;
            if (finalLoad.currentEid !== null) {
                const nodeData = QuestionTree.getNodeFromRealId(finalLoad.currentEid);
                if (nodeData !== null) {
                    const box = $(`
                        <div id="rghForceAnswer" style="display:none">
                            <div class="bold mgt30">参考答案:</div>
                            <div class="mgt10 article bluebg scroll">
                                <pre></pre>
                            </div>
                        </div>
                    `);
                    const wrapper = $(`
                        <div class="mgt10 bold" style="display:none">
                            <div class="fl clearfix mgt20">
                                <a class="f_button4 btn" id="rghForceAnswerBtn">强制显示答案</a>
                            </div>
                        </div>`
                    );
                    const newBtn = wrapper.find('#rghForceAnswerBtn');
                    const btn = $('#rghForceAnswerBtn');
                    newBtn.click(() => {
                        box.slideToggle();
                    });

                    const finalRealId = nodeData.realId;
                    const finalSectionId = nodeData.sectionId;

                    if (nodeData.realId != QuestionLoad.answer.realId || nodeData.sectionId != QuestionLoad.answer.sectionId) {
                        XHRSender.get(
                            `http://ucb.ustb.edu.cn/studentHome/popup?type=key&id=${finalRealId}&c_a_r=1&section_id=${finalSectionId}&sign=0`,
                            (data) => {
                                const parsedData = $('<section>').append(data);
                                QuestionLoad.answer = {
                                    realId: finalRealId,
                                    sectionId: finalSectionId,
                                    data: parsedData,
                                    content: null
                                };

                                let answerDiv;
                                if ((answerDiv = parsedData.find('#div_box_2')).length) {
                                    console.log(answerDiv);
                                    QuestionLoad.answer = {
                                        realId: finalRealId,
                                        sectionId: finalSectionId,
                                        data:parsedData,
                                        content: answerDiv.html()
                                    };
                                    console.log(answerDiv.html());
                                    Logger.info(`获取参考答案已完成（题目ID：${finalRealId}，章节ID：${finalSectionId}，类型：普通）`);
                                } else if ((answerDiv = parsedData.find('#div_box_1')).length) {
                                    const jsVarMatch = /var\s+init_obj\s*=\s*(.+);/g.exec(parsedData.html());
                                    if (jsVarMatch !== null) {
                                        const jsContentMatch = /['"]content['"]\s*:\s*['"](.+)['"]\s*,\s*['"]courseLang['"]\s*:/g.exec(jsVarMatch[1]);
                                        if (jsContentMatch !== null) {
                                            QuestionLoad.answer = {
                                                realId: finalRealId,
                                                sectionId: finalSectionId,
                                                data:parsedData,
                                                content: QuestionLoad.decodeRawJSONString(jsContentMatch[1])
                                            };
                                            console.log(QuestionLoad.decodeRawJSONString(jsContentMatch[1]));
                                            Logger.info(`获取参考答案已完成（题目ID：${finalRealId}，章节ID：${finalSectionId}，类型：脚本）`);
                                        }
                                    }
                                } else {
                                    console.warn("Unknown answer response");
                                }

                                box.find('pre').append(QuestionLoad.answer.content);
                                $('#exercise_submit').append(wrapper);
                                $('#exercise_submit').append(box);
                                wrapper.fadeIn();
                            }
                        );
                    }
                }
            }
        }

        static decodeRawJSONString(str) {
            return JSON.parse(`"${str.replaceAll('\"', '\\\"')}"`);
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

    // Listen on fill-in submissions
    XHRSpy.add('/studentExercise/ajaxSubmitFill', (data, url) => {
        FillInHelper.apply(data.test_txt);
    });

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
        QuestionLoad.showForceAnswer();
        Logger.showStatusBar();
    }, 1000);

})();
