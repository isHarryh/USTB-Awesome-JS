// ==UserScript==
// @name         MOOC Helper
// @version      0.5
// @description  中国大学MOOC慕课辅助脚本
// @author       Harry Huang
// @license      MIT
// @match        *://www.icourse163.org/*
// @run-at       document-start
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @source       https://github.com/isHarryh/USTB-Awesome-JS
// @namespace    https://www.icourse163.org/
// ==/UserScript==

(function() {
    'use strict';

    // Optimize webpage style
    GM_addStyle(`
        .m-learnhead {
            height: 100px !important;
        }

        .m-learnhead-right div {
            align-self: baseline !important;
        }

        .learnPageContent {
            border-radius: 10px !important;
        }

        .u-quizHwListItem .detail {
            padding: 10px 0 !important;
        }

        .u-quizHwInfoItem .infoItem {
            margin: 10px 0 !important;
        }

        .analysisMode .analysisInfo {
            padding: 6px 12px !important;
            margin: 12px 0 6px 0 !important;
        }

        .analysisMode .anserror {
            background: #f3f5ff !important;
            border: 1px solid #bbc0f6 !important;
        }

        .m-quizScore .totalScore {
            margin: 10px 0 0 0 !important;
        }
    `);

    class QuizBean {
        static info = {};
        static paper = {};

        static updateInfo(data) {
            QuizBean.info[data.tid] = {
                quizId: data.tid,
                quizName: data.name,
                papers: data.ansformInfoList && data.ansformInfoList.map(e => ({
                    answerId: e.aid,
                    scoreFinal: e.finalScore,
                    scoreTotal: e.totalScore,
                })),
                targetAnswerId: data.targetAnswerform && data.targetAnswerform.aid,
                tryTimeLimit: data.totalTryCount,
                tryTimeUsed: data.usedTryCount
            };
        }

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
            let successCount = 0;
            // Step 1. Attach embedded answer display to each answer
            const wrapper = $('.j-quizPool .j-data-list');
            if (QuizBean.paper.answers && wrapper.length) {
                // If answers exists and wrapper exists:
                let curIdxO = 0;
                wrapper.children().each((_, e) => {
                    // For each children in wrapper:
                    e = $(e);
                    if (e.hasClass('m-choiceQuestion') && e.find('.j-choicebox').length &&
                        curIdxO < QuizBean.paper.questionListO.length) {
                        // If this is an objective question element
                        const q = QuizBean.paper.questionListO[curIdxO++];
                        const rightAnsIdx = QuizBean.getRightOptionIdxFromQuestionO(q);
                        const rightAnsStr = QuizBean.convertOptionIdxToLetter(rightAnsIdx);
                        const a = QuizBean.getAnswerOById(q.questionId);
                        let box = $(`<div></div>`);

                        if (a && q.questionType == 1) {
                            const myAnsIdx = QuizBean.getMyOptionIdxFromAnswerO(a)
                            const myAnsStr = QuizBean.convertOptionIdxToLetter(myAnsIdx);
                            // Attach embedded answer display
                            box = $(`
                                <div class="analysisInfo mghAnswerO" style="display:none">
                                    <div>
                                        <span class="f-f0 tt1">MOOC Helper 获取的答案：</span>
                                        <span class="f-f0 tt2">${rightAnsStr}</span>
                                    </div>
                                </div>
                            `);
                            if (myAnsStr !== rightAnsStr) {
                                box.addClass('answrong');
                                box.find('div').append(`<span class="tt3">你错选为${myAnsStr}</span>`);
                            }
                            successCount++;
                        } else {
                            box = $(`
                                <div class="analysisInfo mghAnswerO anserror" style="display:none">
                                    <div>
                                        <span class="f-f0 tt1">MOOC Helper 无法获取本题答案，可能是题型不支持或您未作答。</span>
                                    </div>
                                </div>
                            `);
                        }

                        const oldBox = e.find('.mghAnswerO');
                        if (!oldBox.length || oldBox.html() !== box.html()) {
                            if (oldBox.length) {
                                oldBox.remove();
                            }
                            e.find('.j-choicebox').append(box);
                            box.slideDown();
                        }
                    }
                }); // End foreach
            } // End if

            // Step 2. Update status display
            if (wrapper.length) {
                const insertAfter = $('.j-scoreInfo');
                if (insertAfter.length) {
                    const statusBox = $(`
                        <div id="mchPaperStatus" class="totalScore f-f0" style="display:none">
                            <p><b>MOOC Helper:</b></p>
                        </div>`
                    );
                    if (successCount > 0) {
                        statusBox.append("已显示参考答案。");
                        statusBox.append(`本次一共成功获取了 <b>${successCount}</b> 道客观题答案。`);
                        const regex = /(.+#\/learn\/)quizscore\?id=(\d+)&aid=\d+/;
                        if (regex.test(document.URL)) {
                            const href = document.URL.replace(regex, '$1quiz?id=$2');
                            statusBox.append('<br>');
                            statusBox.append(`请注意，每次测验的题目或选项顺序可能改变。`)
                            statusBox.append(`你可以选择 <a href="${href}" target="_blank">在新标签页中再做一次</a> 。`);
                        }
                    } else {
                        statusBox.append("未成功获取到参考答案。可能是该测验记录尚未提交，或者题型不兼容。");
                    }
                    const oldStatusBox = $('#mchPaperStatus');
                    if (!oldStatusBox.length || oldStatusBox.html() !== statusBox.html()) {
                        if (oldStatusBox.length) {
                            oldStatusBox.remove();
                        }
                        statusBox.insertAfter(insertAfter);
                        statusBox.slideDown();
                    }
                }
            } // End if
        } // End method

        static showQuizInfo() {
            // Step 1. Unlock info of each quiz
            const quizItems = $('.m-chapterQuizHwItem');
            if (quizItems.length && Object.keys(QuizBean.info).length) {
                if (quizItems.length === Object.keys(QuizBean.info).length) {
                    quizItems.each((i, e) => {
                        const curQuiz = QuizBean.info[Object.keys(QuizBean.info)[i]];
                        QuizBean.showQuizInfoSingle(curQuiz, $(e));
                    });
                } else {
                    console.warn("Inconsistent quiz item length");
                }
            }
        }

        static showQuizInfoSingle(curQuiz, curQuizElem) {
            let count = 0;
            const ansUl = curQuizElem.find('.j-ansul');
            if (ansUl.length) {
                const ansLis = ansUl.find('.f-cb').not('.hd');
                if (ansLis.length && curQuiz.papers) {
                    if (ansLis.length === curQuiz.papers.length) {
                        ansLis.each((i, e) => {
                            const curPaper = curQuiz.papers[Object.keys(curQuiz.papers)[i]];
                            const trick = $(e).find('.j-triggerLockScore');
                            if (trick.length) {
                                trick.replaceWith(`<span>${curPaper.scoreFinal.toFixed(2)}（已解锁）</span>`);
                                count += 1;
                            }
                        });
                    } else {
                        console.warn("Inconsistent answer list length");
                    }
                }
            }
            if (count) {
                const tip = $(`
                    <p class="infoItem">
                        <span class="f-icon u-icon-warning2"></span>
                        <span class="gray">MOOC Helper 已自动解锁 ${count} 个不可查看的分数</span>
                    </p>
                `);
                tip.insertAfter(ansUl);
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
    XHRSpy.add('/web/j/mocQuizRpcBean.getOpenQuizInfo.rpc', (data, url) => {
        QuizBean.updateInfo(data);
    });

    setInterval(() => {
        QuizBean.showPaperAnswer();
        QuizBean.showQuizInfo();
    }, 500);

    console.log("MOOC Helper Start");

})();
