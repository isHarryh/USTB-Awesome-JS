// ==UserScript==
// @name         USTB RG Helper
// @namespace    http://ucb.ustb.edu.cn/
// @version      0.1
// @description  北京科技大学锐格实验平台辅助工具
// @author       Harry Huang
// @match        *://ucb.ustb.edu.cn/*
// @run-at       document-body
// @grant        GM_addStyle
// @grant        GM_getResourceURL
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
            position: unset !important;
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
        #lh-rel-time {
            color: #44c;
            padding: 0 5px;
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
            console.log("Raw text: " + txt + "\n" + "Answer string: " + answerStr);
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
            const displayInner = $('#lh-rel-time');
            if (title !== null && display !== null) {
                const nodeData = QuestionTree.getNodeFromName(title.text());
                if (nodeData !== null && nodeData.type === 'exercise') {
                    let text = "";
                    if (nodeData.time_open) {
                        text += `${DateTimeHelper.toRelTime(nodeData.time_open)}开始`;
                    }
                    if (nodeData.time_close) {
                        if (nodeData.time_open) {
                            text += "，";
                        }
                        text += `${DateTimeHelper.toRelTime(nodeData.time_close)}截止`;
                    }

                    const displayInnerNew = $(`<span id="lh-rel-time" style="display:none">${text}</span>`);
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

    class QuestionTree {
        static nodes = {}

        static updateNodes(newNodes) {
            newNodes.forEach((e) => {
                QuestionTree.nodes[`${e.name}`] = ({
                    name: e.name,
                    type: e.type,
                    section: e.section_id,
                    time_open: e.start_time,
                    time_close: e.done_time
                })
            });
        }

        static getNodeFromName(name) {
            return QuestionTree.nodes[name] || null;
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

    setInterval(DateTimeHelper.showRelTimeOnArticle, 1000);

})();
