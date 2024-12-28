// ==UserScript==
// @name         Chaoxing Helper
// @version      0.1
// @description  超星学习通辅助脚本
// @author       Harry Huang
// @license      MIT
// @match        *://*.chaoxing.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @source       https://github.com/isHarryh/USTB-OES-JS
// @namespace    https://chaoxing.com/
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        .cxhCompact * {
            font-family: '微软雅黑' !important;
            font-size: 14px !important;
        }

        .cxhCompact .subNav,
        .cxhCompact .het40,
        .cxhCompact .tit_collcet_btn,
        .cxhCompact .marking_cuo,
        .cxhCompact .fanyaMarking_right,
        .cxhCompact .infoHead div {
            display: none !important;
        }

        .cxhCompact .fanyaMarking_left {
            width: 100% !important;
        }

        .cxhCompact .marBom60 {
            margin-bottom: 32px !important;
        }

        .cxhCompact .analysisDiv .analysis {
            color: gray !important;
            padding-bottom: 0 !important;
        }

        .cxhCompact .analysisDiv .analysis i {
            width: 100px !important;
        }

        .cxhCompact .mark_key .colorDeep {
            color: gray !important;
        }

        .cxhCompact .mark_key .colorGreen {
            color: green !important;
        }

        .cxhCompact .mark_letter li {
            margin-top: 8px !important;
        }

        .cxhCompact .padTop60 {
            padding-top: 32px !important;
        }
    `);


    $(document).ready(() => {
        if (document.URL.includes('/exam-ans/exam/test/reVersionPaperMarkContentNew')) {
            const head = $('.analysisCard');
            if (head.length) {
                const toggle = $(`<a class="wrongPractise" id="cxhCompactToggle" href="javascript:;"><i></i>紧凑模式</a>`);
                toggle.click(() => {
                    $('body').toggleClass('cxhCompact');
                });
                head.append(toggle);
            }
        }
    });

    console.log("Chaoxing Helper Start");

})();
