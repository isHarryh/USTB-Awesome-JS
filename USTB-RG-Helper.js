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
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Optimize webpage style
    GM_addStyle(`
        /* USTH RG Helper */
        #outter {
            padding: 0 !important;
        }
        .buttom {
            position: unset !important;
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

})();
