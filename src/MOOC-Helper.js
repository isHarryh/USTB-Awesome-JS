// ==UserScript==
// @name         MOOC Helper
// @version      0.8
// @description  中国大学MOOC慕课辅助脚本
// @author       Harry Huang
// @license      MIT
// @match        *://www.icourse163.org/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @source       https://github.com/isHarryh/USTB-Awesome-JS
// @downloadURL  https://github.com/isHarryh/USTB-Awesome-JS/raw/refs/heads/main/src/MOOC-Helper.js
// @updateURL    https://github.com/isHarryh/USTB-Awesome-JS/raw/refs/heads/main/src/MOOC-Helper.js
// @namespace    https://www.icourse163.org/
// ==/UserScript==

(function () {
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

        #j-activityBanner {
            /* Remove banner ad */
            display: none !important;
        }
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

    class HomeworkBean {
        static paper = {};

        static updatePaper(data) {
            // Extract data from JavaScript response using regex
            const realNameMatch = data.match(/realName:\s*"((?:\\u[0-9a-fA-F]{4}|[^"])*)"/);
            const nickNameMatch = data.match(/nickName:\s*"((?:\\u[0-9a-fA-F]{4}|[^"])*)"/);
            const studentNumberMatch = data.match(/studentNumber:\s*"([^"]*)"/);

            // Decode Unicode escape sequences
            const decodeUnicode = (str) => {
                return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
                    return String.fromCharCode(parseInt(code, 16));
                });
            };

            HomeworkBean.paper = {
                realName: realNameMatch ? decodeUnicode(realNameMatch[1]) : null,
                nickName: nickNameMatch ? decodeUnicode(nickNameMatch[1]) : null,
                studentNumber: studentNumberMatch ? studentNumberMatch[1] : null
            };
            console.log(HomeworkBean.paper);
        }

        static showPaperInfo() {
            const container = $('.j-evaluate-status-head');
            if (container.length && HomeworkBean.paper.realName) {
                const infoBox = $(`
                    <div class="mghHomeworkInfo" style="margin-top: 10px; padding: 10px; background: #f3f5ff; border: 1px solid #bbc0f6; border-radius: 4px;">
                        <p><b>学生信息：</b></p>
                        ${HomeworkBean.paper.realName ? `<p>姓名：${HomeworkBean.paper.realName}</p>` : ''}
                        ${HomeworkBean.paper.nickName ? `<p>昵称：${HomeworkBean.paper.nickName}</p>` : ''}
                        ${HomeworkBean.paper.studentNumber ? `<p>学号：${HomeworkBean.paper.studentNumber}</p>` : ''}
                    </div>
                `);

                const oldBox = container.find('.mghHomeworkInfo');
                if (!oldBox.length || oldBox.html() !== infoBox.html()) {
                    if (oldBox.length) {
                        oldBox.remove();
                    }
                    container.append(infoBox);
                }
            }
        }
    }

    class ButtonRecorder {
        static STORAGE_KEY = 'mooc_helper_button_recorder_last_id';
        static POPOVER_CLASS = 'mghButtonRecorderPopover';

        static init() {
            $(document).on('mousedown', '.u-btn', (e) => {
                const btn = $(e.currentTarget).closest('.u-btn');
                if (!btn.length) return;

                const id = btn.attr('id');
                if (id && /^auto-id-\d+$/.test(id)) {
                    ButtonRecorder.recordButtonId(id);
                    console.log(`ButtonRecorder: Recorded button ID: ${id}`);
                }
            });
        }

        static recordButtonId(id) {
            GM_setValue(ButtonRecorder.STORAGE_KEY, id);
        }

        static getRecordedId() {
            return GM_getValue(ButtonRecorder.STORAGE_KEY, null);
        }

        static clearRecord() {
            GM_setValue(ButtonRecorder.STORAGE_KEY, null);
        }

        static showLastVisitPopover() {
            const recordedId = ButtonRecorder.getRecordedId();
            if (!recordedId) return;

            const element = $(`#${recordedId}`);
            if (!element.length) return;

            // Prevent duplicate popovers
            if (element.find(`.${ButtonRecorder.POPOVER_CLASS}`).length) return;

            const popover = $(`
                <div class="${ButtonRecorder.POPOVER_CLASS}" style="
                    position: absolute;
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    background: #e9fef0;
                    padding: 6px 12px;
                    border-radius: 8px;
                    white-space: nowrap;
                    z-index: 9999;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-right: 8px;
                    border: 1px solid #c0f0da;
                    display: flex;
                    gap: 12px;
                ">
                    <div style="display: flex; flex-direction: column; gap: 1px;">
                        <span style="font-size: 9px; color: #999;">MOOC Helper 提示</span>
                        <span style="font-size: 13px; color: #666;">您上次访问</span>
                    </div>
                    <button style="
                        background: none;
                        border: none;
                        color: #999;
                        cursor: pointer;
                        font-size: 13px;
                        padding: 0;
                        font-weight: bold;
                        line-height: 1;
                        flex-shrink: 0;
                    ">✕</button>
                </div>
            `);

            // Create triangle using CSS
            const triangleStyle = `
                .${ButtonRecorder.POPOVER_CLASS}::after {
                    content: '';
                    position: absolute;
                    right: -6px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 0;
                    height: 0;
                    border-left: 6px solid #c0f0da;
                    border-top: 5px solid transparent;
                    border-bottom: 5px solid transparent;
                }
            `;

            // Add style if not already added
            if (!$('#mghButtonRecorderPopoverStyle').length) {
                $('head').append(`<style id="mghButtonRecorderPopoverStyle">${triangleStyle}</style>`);
            }

            // Close button event
            popover.on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                popover.fadeOut(200, () => {
                    popover.remove();
                    ButtonRecorder.clearRecord();
                });
            });

            // Ensure element has position context for absolute positioning
            if (element.css('position') === 'static') {
                element.css('position', 'relative');
            }

            popover.hide();
            element.append(popover);
            popover.fadeIn(200);
        }
    }

    class TestListHijacker {
        static STORAGE_PREFIX = 'mooc_helper_testlist_hijacker_';
        static DEFAULT_OPTIONS = {
            quizScore: 'original',      // original, fullScore, random60, random80
            homeworkScore: 'original',  // original
            unlockStatus: 'original'    // original, unlocked, locked
        };
        static pendingOptions = {
            quizScore: null,
            homeworkScore: null,
            unlockStatus: null
        };

        static init() {
            // Initialize options from Tampermonkey storage
            if (TestListHijacker.getOption('quizScore') === null) {
                TestListHijacker.setOption('quizScore', TestListHijacker.DEFAULT_OPTIONS.quizScore);
            }
            if (TestListHijacker.getOption('homeworkScore') === null) {
                TestListHijacker.setOption('homeworkScore', TestListHijacker.DEFAULT_OPTIONS.homeworkScore);
            }
            if (TestListHijacker.getOption('unlockStatus') === null) {
                TestListHijacker.setOption('unlockStatus', TestListHijacker.DEFAULT_OPTIONS.unlockStatus);
            }

            $(document).ready(() => {
                // Set window variables based on unlockStatus
                const unlockStatus = TestListHijacker.getOption('unlockStatus') || TestListHijacker.DEFAULT_OPTIONS.unlockStatus;
                switch (unlockStatus) {
                    case 'unlocked':
                        unsafeWindow.shouldShowScore = true;
                        unsafeWindow.shouldHiddenScore = false;
                        console.log("Set scores to unlocked state");
                        break;
                    case 'locked':
                        unsafeWindow.shouldShowScore = false;
                        unsafeWindow.shouldHiddenScore = true;
                        console.log("Set scores to locked state");
                        break;
                    case 'original':
                    default:
                        break;
                }
            });
        }

        static getOption(key) {
            const storageKey = TestListHijacker.STORAGE_PREFIX + key;
            return GM_getValue(storageKey, null);
        }

        static setOption(key, value) {
            const storageKey = TestListHijacker.STORAGE_PREFIX + key;
            GM_setValue(storageKey, value);
        }

        static hasPendingChanges() {
            return TestListHijacker.pendingOptions.quizScore !== null ||
                TestListHijacker.pendingOptions.homeworkScore !== null ||
                TestListHijacker.pendingOptions.unlockStatus !== null;
        }

        static applyChanges() {
            if (TestListHijacker.pendingOptions.quizScore !== null) {
                TestListHijacker.setOption('quizScore', TestListHijacker.pendingOptions.quizScore);
            }
            if (TestListHijacker.pendingOptions.homeworkScore !== null) {
                TestListHijacker.setOption('homeworkScore', TestListHijacker.pendingOptions.homeworkScore);
            }
            if (TestListHijacker.pendingOptions.unlockStatus !== null) {
                TestListHijacker.setOption('unlockStatus', TestListHijacker.pendingOptions.unlockStatus);
            }
            // Refresh page to apply changes
            window.location.reload();
        }

        static modifyQuizInfoData(data) {
            const quizScore = TestListHijacker.getOption('quizScore') || TestListHijacker.DEFAULT_OPTIONS.quizScore;
            if (quizScore === 'original' || !data) {
                return data;
            }

            // Modify usedTryCount
            if (data.usedTryCount !== undefined) {
                data.usedTryCount = 1;
            }

            // Rebuild ansformInfoList with single element
            const totalScore = data.totalScore || 100;
            let modifiedScore = 0;

            switch (quizScore) {
                case 'fullScore':
                    modifiedScore = totalScore;
                    break;
                case 'random60':
                    // Random score between 60% and 100% of totalScore
                    const min60 = totalScore * 0.6;
                    modifiedScore = min60 + Math.random() * (totalScore - min60);
                    break;
                case 'random80':
                    // Random score between 80% and 100% of totalScore
                    const min80 = totalScore * 0.8;
                    modifiedScore = min80 + Math.random() * (totalScore - min80);
                    break;
            }

            // Replace ansformInfoList with single modified element
            data.ansformInfoList = [{
                aid: 0,
                finalScore: modifiedScore,
                score: modifiedScore,
                submitTime: TestListHijacker.calculateSubmitTime(
                    data.deadline || Date.now(),
                    1,
                    'nighttime'
                )
            }];

            // Replace effectScore
            data.effectScore = modifiedScore;

            return data;
        }

        static calculateModifiedScore(totalScore) {
            const quizScore = TestListHijacker.getOption('quizScore') || TestListHijacker.DEFAULT_OPTIONS.quizScore;

            if (quizScore === 'original') {
                return null; // No modification needed
            }

            let modifiedScore = 0;

            switch (quizScore) {
                case 'fullScore':
                    modifiedScore = totalScore;
                    break;
                case 'random60':
                    // Random score between 60% and 100% of totalScore
                    const min60 = totalScore * 0.6;
                    modifiedScore = min60 + Math.random() * (totalScore - min60);
                    break;
                case 'random80':
                    // Random score between 80% and 100% of totalScore
                    const min80 = totalScore * 0.8;
                    modifiedScore = min80 + Math.random() * (totalScore - min80);
                    break;
            }

            return modifiedScore;
        }

        static calculateSubmitTime(deadline, advanceDayCount, timeRange) {
            // Convert deadline to Date if it's a timestamp
            const deadlineDate = new Date(deadline);

            // Calculate target date (advanceDayCount days before deadline)
            const targetDate = new Date(deadlineDate);
            targetDate.setDate(targetDate.getDate() - advanceDayCount);

            // Use deadline as seeded random generator
            let seed = deadline % 233280;
            const seededRandom = () => {
                seed = (seed * 9301 + 49297) % 233280;
                return seed / 233280;
            };

            // Determine time range
            let startHour = 0, endHour = 24;
            switch (timeRange) {
                case 'daytime':
                    startHour = 6;
                    endHour = 18;
                    break;
                case 'nighttime':
                    startHour = 18;
                    endHour = 24;
                    break;
                case 'alltime':
                default:
                    startHour = 0;
                    endHour = 24;
                    break;
            }

            // Random time within the range using seeded random
            const randomHour = startHour + seededRandom() * (endHour - startHour);
            const randomMinute = seededRandom() * 59.9;
            const randomSecond = seededRandom() * 59.9;

            targetDate.setHours(Math.floor(randomHour), Math.floor(randomMinute), Math.floor(randomSecond));

            return targetDate.getTime(); // Return timestamp in milliseconds
        }

        static modifyTermData(data) {
            const quizScore = TestListHijacker.getOption('quizScore') || TestListHijacker.DEFAULT_OPTIONS.quizScore;
            const homeworkScore = TestListHijacker.getOption('homeworkScore') || TestListHijacker.DEFAULT_OPTIONS.homeworkScore;
            if ((quizScore === 'original' && homeworkScore === 'original') || !data || !data.mocTermDto) {
                return data;
            }

            // Iterate through chapters
            if (data.mocTermDto.chapters && Array.isArray(data.mocTermDto.chapters)) {
                data.mocTermDto.chapters.forEach((chapter) => {
                    // Handle quiz scores
                    if (quizScore !== 'original' && chapter.quizs && Array.isArray(chapter.quizs)) {
                        chapter.quizs.forEach((quiz) => {
                            if (quiz.test) {
                                const modifiedScore = TestListHijacker.calculateModifiedScore(quiz.test.totalScore || 100);
                                if (modifiedScore !== null) {
                                    quiz.test.userScore = modifiedScore;
                                }
                            }
                        });
                    }
                    // Handle homework scores
                    if (homeworkScore !== 'original' && chapter.homeworks && Array.isArray(chapter.homeworks)) {
                        chapter.homeworks.forEach((homework) => {
                            if (homework.test && homeworkScore === 'zero') {
                                homework.test.userScore = 0;
                                homework.test.usedTryCount = 1;
                                homework.test.testTime = Date.now();
                            }
                        });
                    }
                });
            }

            return data;
        }

        static updateApplyButton() {
            const applyBtn = $('#mghApplyChangesBtn');
            if (TestListHijacker.hasPendingChanges()) {
                applyBtn.show();
            } else {
                applyBtn.hide();
            }
        }

        static showTestListHijacker() {
            const hash = window.location.hash;
            if (!hash.includes('#/learn/testlist')) return;

            const container = $('.learnPageContentLeft');
            if (!container.length) return;

            // Check if already exists
            if (container.find('.mghTestListHijacker').length) return;

            const quizScoreValue = TestListHijacker.getOption('quizScore') || TestListHijacker.DEFAULT_OPTIONS.quizScore;
            const homeworkScoreValue = TestListHijacker.getOption('homeworkScore') || TestListHijacker.DEFAULT_OPTIONS.homeworkScore;
            const unlockStatusValue = TestListHijacker.getOption('unlockStatus') || TestListHijacker.DEFAULT_OPTIONS.unlockStatus;

            // Check if any option is not 'original'
            const hasHijacking = quizScoreValue !== 'original' ||
                homeworkScoreValue !== 'original' ||
                unlockStatusValue !== 'original';

            let warningHtml = '';
            if (hasHijacking) {
                warningHtml = `
                    <div style="background: #fff3cd; border-radius: 4px; padding: 15px; margin-bottom: 15px; color: #856404;">
                        <p style="margin: 0; font-weight: bold; font-size: 13px;">⚠️ 警告：当前已启用测验列表结果劫持。</p>
                        <p style="margin: 5px 0 0 0; font-size: 13px;">界面中显示的数据可能与系统后台的数据不一致。如需显示真实数据，请将下方所有选项设置到"原样"。</p>
                    </div>
                `;
            }

            const hijackerBox = $(`
                <div class="m-learnbox mghTestListHijacker">
                    <h3 class="f-fl j-moduleName">MOOC Helper 测验列表劫持选项</h3>
                    <div style="margin-top: 30px; padding: 15px;">
                        ${warningHtml}
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: bold;">将测验分数调整为：</label>
                            <select id="mghQuizScoreOption" style="padding: 5px; width: 250px;">
                                <option value="original" ${quizScoreValue === 'original' ? 'selected' : ''}>原样（不作调整）</option>
                                <option value="fullScore" ${quizScoreValue === 'fullScore' ? 'selected' : ''}>满分</option>
                                <option value="random60" ${quizScoreValue === 'random60' ? 'selected' : ''}>满分的60%以上的随机分数</option>
                                <option value="random80" ${quizScoreValue === 'random80' ? 'selected' : ''}>满分的80%以上的随机分数</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: bold;">将作业分数调整为：</label>
                            <select id="mghHomeworkScoreOption" style="padding: 5px; width: 250px;">
                                <option value="original" ${homeworkScoreValue === 'original' ? 'selected' : ''}>原样（不作调整）</option>
                                <option value="zero" ${homeworkScoreValue === 'zero' ? 'selected' : ''}>零分</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: bold;">将分数解锁情况调整为：</label>
                            <select id="mghUnlockStatusOption" style="padding: 5px; width: 250px;">
                                <option value="original" ${unlockStatusValue === 'original' ? 'selected' : ''}>原样（不作调整）</option>
                                <option value="unlocked" ${unlockStatusValue === 'unlocked' ? 'selected' : ''}>已解锁得分情况</option>
                                <option value="locked" ${unlockStatusValue === 'locked' ? 'selected' : ''}>未解锁得分情况</option>
                            </select>
                        </div>
                        <div>
                            <button id="mghApplyChangesBtn" class="u-btn u-btn-default" style="display: none;">
                                应用更改并刷新
                            </button>
                        </div>
                    </div>
                </div>
            `);

            container.prepend(hijackerBox);

            // Bind events
            $('#mghQuizScoreOption').on('change', (e) => {
                const value = $(e.target).val();
                const currentValue = TestListHijacker.getOption('quizScore') || TestListHijacker.DEFAULT_OPTIONS.quizScore;
                if (value !== currentValue) {
                    TestListHijacker.pendingOptions.quizScore = value;
                    TestListHijacker.updateApplyButton();
                }
            });

            $('#mghHomeworkScoreOption').on('change', (e) => {
                const value = $(e.target).val();
                const currentValue = TestListHijacker.getOption('homeworkScore') || TestListHijacker.DEFAULT_OPTIONS.homeworkScore;
                if (value !== currentValue) {
                    TestListHijacker.pendingOptions.homeworkScore = value;
                    TestListHijacker.updateApplyButton();
                }
            });

            $('#mghUnlockStatusOption').on('change', (e) => {
                const value = $(e.target).val();
                const currentValue = TestListHijacker.getOption('unlockStatus') || TestListHijacker.DEFAULT_OPTIONS.unlockStatus;
                if (value !== currentValue) {
                    TestListHijacker.pendingOptions.unlockStatus = value;
                    TestListHijacker.updateApplyButton();
                }
            });

            $('#mghApplyChangesBtn').on('click', () => {
                TestListHijacker.applyChanges();
            });
        }
    }

    class XHRSpy {
        static listeners = [];
        static originalSend = XMLHttpRequest.prototype.send;
        static replacedSend = XMLHttpRequest.prototype.send = function (...args) {
            const xhr = this;
            const originCallback = xhr.onreadystatechange;
            xhr.onreadystatechange = function () {
                // Invoke our listeners before the original one
                XHRSpy.listeners.forEach((l) => l(xhr));
                originCallback();
            };
            return XHRSpy.originalSend.apply(xhr, args);
        };

        static add(pathNamePrefix, handler) {
            XHRSpy.listeners.push(function (xhr) {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    let url = new URL(xhr.responseURL);
                    if (url.pathname.startsWith(pathNamePrefix)) {
                        let json;
                        try {
                            json = JSON.parse(xhr.responseText);
                        } catch (err) {
                            console.warn("Response is not JSON format, pass to handler directly");
                            handler(xhr.responseText, url);
                            return;
                        }

                        // JSON contents is { code: int, msg: str, result: obj }
                        if (json.code !== 0 || json.result === undefined) {
                            console.error(`Response not success\ncode=${json.code}\nmessage=${json.msg}`)
                        } else {
                            try {
                                const modifiedResult = handler(json.result, url);
                                // If handler returns modified data, update xhr.responseText
                                if (modifiedResult !== undefined) {
                                    json.result = modifiedResult;
                                    Object.defineProperty(xhr, 'responseText', {
                                        writable: true,
                                        value: JSON.stringify(json)
                                    });
                                    console.log("Response modified by handler");
                                }
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
        data = TestListHijacker.modifyQuizInfoData(data);
        return data;
    });
    XHRSpy.add('/dwr/call/plaincall/MocQuizBean.getHomeworkPaperDto.dwr', (data, url) => {
        HomeworkBean.updatePaper(data);
    });
    XHRSpy.add('/web/j/courseBean.getLastLearnedMocTermDto.rpc', (data, url) => {
        data = TestListHijacker.modifyTermData(data);
        return data;
    });

    setInterval(() => {
        QuizBean.showPaperAnswer();
        HomeworkBean.showPaperInfo();
        TestListHijacker.showTestListHijacker();
        ButtonRecorder.showLastVisitPopover();
    }, 500);

    // Initialize helpers
    TestListHijacker.init();
    ButtonRecorder.init();

    console.log("MOOC Helper Start");

})();
