// ==UserScript==
// @name         MOOC Helper
// @version      0.1
// @description  中国大学MOOC慕课辅助脚本
// @author       Harry Huang
// @license      MIT
// @match        *://www.icourse163.org/*
// @run-at       document-start
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @source       https://github.com/isHarryh/USTB-OES-JS
// @namespace    https://www.icourse163.org/
// ==/UserScript==

(function() {
    'use strict';

    // Optimize webpage style
    GM_addStyle(`
    `);

    class QuizBean {
        static paper = {};

        static updatePaper(data) {
            QuizBean.paper = {
                answerId: data.aid,
                quizId: data.tid,
                quizName: data.tname,
                timeOpen: data.startTime,
                timeClose: data.deadline,
                timeSubmit: data.submitTime,
                tryTimeLimit: data.tryTime,
                tryTimeUsed: data.usedTryCount,
                scoreO: data.objectiveScore,
                scoreS: data.subjectiveScore,
                answers: data.answers && data.answers.map(e => ({
                    questionId: e.qid,
                    questionType: e.type,
                    optionIdList: e.optIds,
                    score: e.score
                })),
                questionListO: data.objectiveQList && data.objectiveQList.map(e => ({
                    questionId: e.id,
                    questionType: e.type,
                    scoreMax: e.score,
                    optionList: e.optionDtos && e.optionDtos.map(o => ({
                        optionId: o.id,
                        isAnswer: o.answer
                    }))
                }))
            };
            console.log(QuizBean.paper);
        }

        static showPaperAnswer() {
            if ($('.j-scoreInfo').length) {
                // Read quiz bean data to get answers
                const box = $(`
                    <div id="mchPaperAnswer" class="totalScore f-f0" style="display:none">
                        <p><b>MOOC Helper:</b></p>
                    </div>
                `);
                let hasAnswer = false;
                if (QuizBean.paper.answerId) {
                    for (let ei = 0; ei < QuizBean.paper.questionListO.length; ei++) {
                        const e = QuizBean.paper.questionListO[ei];
                        const correctIdx = [];
                        for (let oi = 0; oi < e.optionList.length; oi++) {
                            const o = e.optionList[oi];
                            if (o.isAnswer) {
                                correctIdx.push(oi);
                                hasAnswer = true;
                            }
                        }
                        box.append(`${ei + 1}.`);
                        correctIdx.forEach((oi) => {
                            if (0 <= oi && oi < 26) {
                                box.append("ABCDEFGHIJKLMNOPQRSTUVWXYZ"[oi]);
                            } else {
                                console.warn("Invalid option index");
                            }
                        });
                        box.append("&nbsp;");
                    }
                }

                // Show display box in document
                const oldBox = $('#mchPaperAnswer');
                if (oldBox.length) {
                    if (oldBox.html() !== box.html()) {
                        oldBox.remove();
                    }
                } else {
                    if (hasAnswer) {
                        box.insertAfter($('.j-scoreInfo'));
                        box.fadeIn();
                    }
                }
            }
        }
    }

    class XHRSpy {
        static listeners = [];
        static originalSend = XMLHttpRequest.prototype.send;
        static replacedSend = XMLHttpRequest.prototype.send = function(...args) {
            const xhr = this;
            const originCallback = xhr.onreadystatechange;
            xhr.onreadystatechange = function() {
                // Invoke our listeners before the original one
                XHRSpy.listeners.forEach((l) => l(xhr));
                originCallback();
            };
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

                        // JSON contents is { code: int, msg: str, result: obj }
                        if (json.code !== 0 || json.result === undefined) {
                            console.error(`Response not success\ncode=${json.code}\nmessage=${json.msg}`)
                        } else {
                            try {
                                handler(json.result, url);
                            } catch (err) {
                                console.error("Response handling failed", err);
                            }
                        }
                    }
                }
            });
        }
    }

    // Listen on quiz bean responses
    XHRSpy.add('/web/j/mocQuizRpcBean.getOpenQuizPaperDto.rpc', (data, url) => {
        QuizBean.updatePaper(data);
    });

    setInterval(() => {
        QuizBean.showPaperAnswer();
    }, 500);

    console.log("MOOC Helper Start");

})();
