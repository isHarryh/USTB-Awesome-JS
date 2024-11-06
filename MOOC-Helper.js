// ==UserScript==
// @name         MOOC Helper
// @version      0.2
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
            if (QuizBean.paper.answers) {
                // Attach answer display box to the question
                const wrapper = $('.j-quizPool .j-data-list');
                if (wrapper.length) {
                    let curIdxO = 0;
                    wrapper.children().each((_, e) => {
                        e = $(e);
                        if (e.hasClass('m-choiceQuestion') && e.find('.j-choicebox').length) {
                            // Objective question element
                            if (curIdxO < QuizBean.paper.questionListO.length) {
                                const q = QuizBean.paper.questionListO[curIdxO];
                                const rightAnsIdx = QuizBean.getRightOptionIdxFromQuestionO(q);
                                const rightAnsStr = QuizBean.convertOptionIdxToLetter(rightAnsIdx);
                                const a = QuizBean.getAnswerOById(q.questionId);
                                const myAnsIdx = QuizBean.getMyOptionIdxFromAnswerO(a)
                                const myAnsStr = QuizBean.convertOptionIdxToLetter(myAnsIdx);

                const box = $(`
                                    <div class="analysisInfo mghAnswerO" style="display:none">
                                        <div>
                                            <span class="f-f0 tt1">MOOC Helper 提供的答案：</span>
                                            <span class="f-f0 tt2">${rightAnsStr}</span>
                                        </div>
                    </div>
                `);
                                if (myAnsStr !== rightAnsStr) {
                                    box.addClass('answrong');
                                    box.find('div').append(`<span class="tt3">你错选为${myAnsStr}</span>`);
                                }
                                curIdxO++;
                                const oldBox = e.find('.mghAnswerO');
                                if (!oldBox.length || oldBox.html() !== box.html()) {
                                    if (oldBox.length) {
                                        oldBox.remove();
                                    }
                                    e.find('.j-choicebox').append(box);
                                    box.slideDown();
                                }
                            }
                        }
                    });
                }
            }
        }

        static getQuestionOById(questionId) {
            for (let i = 0; i < QuizBean.paper.questionListO.length; i++) {
                if (QuizBean.paper.questionListO[i].questionId === questionId) {
                    return QuizBean.paper.questionListO[i];
                }
            }
            return null;
        }

        static getAnswerOById(questionId) {
            for (let i = 0; i < QuizBean.paper.answers.length; i++) {
                if (QuizBean.paper.answers[i].questionId === questionId) {
                    return QuizBean.paper.answers[i];
                }
            }
            return null;
        }

        static getRightOptionIdxFromQuestionO(question) {
            const rst = [];
            for (let i = 0; i < question.optionList.length; i++) {
                if (question.optionList[i].isAnswer) {
                    rst.push(i);
                }
            }
            return rst;
        }

        static getMyOptionIdxFromAnswerO(answer) {
            const q = QuizBean.getQuestionOById(answer.questionId);
            const rst = [];
            answer.optionIdList.forEach((e) => {
                for (let i = 0; i < q.optionList.length; i++) {
                    if (q.optionList[i].optionId === e) {
                        rst.push(i);
                    }
                            }
                        });
            return rst;
        }

        static convertOptionIdxToLetter(optionIdx) {
            if (Number.isInteger(optionIdx)) {
                return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[optionIdx];
                } else {
                const rst = [];
                optionIdx.sort();
                optionIdx.forEach((e) => {
                    rst.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ"[e]);
                });
                return rst.join('');
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
