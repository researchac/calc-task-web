(function () {
  "use strict";

  // =========================================================
  // 0. jsPsych・プラグインの確認
  // =========================================================

  var jsPsych = window.jsPsych;

  var HtmlButtonResponse =
    window.jsPsychHtmlButtonResponse;

  var SurveyHtmlForm =
    window.jsPsychSurveyHtmlForm;

  if (!jsPsych) {
    throw new Error(
      "jsPsychが初期化されていません。"
    );
  }

  if (typeof HtmlButtonResponse !== "function") {
    throw new Error(
      "HTML Button Responseプラグインが読み込まれていません。"
    );
  }

  if (typeof SurveyHtmlForm !== "function") {
    throw new Error(
      "Survey HTML Formプラグインが読み込まれていません。"
    );
  }


  // =========================================================
  // 1. Qualtricsから受け取る情報
  // =========================================================

  // 参加者ID
  var PARTICIPANT_ID = String(
    window.CALC_PARTICIPANT_ID || "LOCAL_TEST"
  );

  // 実験条件
  // "promotion" または "prevention"

  var CONDITION = String(
    window.CALC_CONDITION || ""
  ).toLowerCase();

  if (
    CONDITION !== "promotion" &&
    CONDITION !== "prevention"
  ) {
    throw new Error(
      "実験条件が正しく設定されていません。"
    );
  }


  // 別ファイル instruction_page.js から
  // 教示文HTMLを受け取る

  if (
    typeof window.CALC_TASK_INSTRUCTION_HTML !== "string" ||
    window.CALC_TASK_INSTRUCTION_HTML.trim() === ""
  ) {
    throw new Error(
      "教示文ページが読み込まれていません。" +
      "instruction_page.jsを先に読み込んでください。"
    );
  }


  // =========================================================
  // 2. 課題の基本設定
  // =========================================================

  var TASK_TIME_LIMIT_MS = 10 * 60 * 1000;

  var TOTAL_MAIN_QUESTIONS = 20;

  var OPERATOR_OPTIONS = [
    { value: "+", label: "＋" },
    { value: "-", label: "－" },
    { value: "*", label: "×" },
    { value: "/", label: "÷" }
  ];


  // =========================================================
  // 3. 本番問題20問
  // =========================================================

  // 正解演算子は参加者側のJavaScriptに含めない

  var MAIN_QUESTIONS = [

    { id: "Q01", numbers: [4, 6, 3, 9], target: 6 },

    { id: "Q02", numbers: [7, 7, 1, 1], target: 3 },

    { id: "Q03", numbers: [5, 4, 6, 8], target: 2 },

    { id: "Q04", numbers: [2, 9, 9, 4], target: 8 },

    { id: "Q07", numbers: [9, 7, 5, 3], target: 1 },

    { id: "Q08", numbers: [7, 7, 5, 2], target: 8 },

    { id: "Q09", numbers: [4, 6, 6, 3], target: 2 },

    { id: "Q10", numbers: [5, 2, 1, 7], target: 4 },

    { id: "Q11", numbers: [8, 1, 8, 4], target: 9 },

    { id: "Q12", numbers: [7, 6, 7, 5], target: 7 },

    { id: "Q13", numbers: [3, 1, 9, 9], target: 5 },

    { id: "Q16", numbers: [8, 5, 4, 5], target: 5 },

    { id: "Q17", numbers: [9, 8, 4, 3], target: 3 },

    { id: "Q19", numbers: [9, 3, 2, 5], target: 1 },

    { id: "Q20", numbers: [1, 5, 8, 8], target: 4 },

    { id: "Q21", numbers: [2, 8, 8, 5], target: 6 },

    { id: "Q22", numbers: [4, 2, 5, 1], target: 9 },

    { id: "Q23", numbers: [6, 3, 1, 6], target: 7 },

    { id: "Q25", numbers: [2, 9, 7, 2], target: 4 },

    { id: "Q29", numbers: [1, 4, 3, 7], target: 6 }

  ];


  if (MAIN_QUESTIONS.length !== TOTAL_MAIN_QUESTIONS) {
    throw new Error(
      "本番問題の数が20問ではありません。"
    );
  }


  // =========================================================
  // 4. 実験中に使用する変数
  // =========================================================

  var mainDeadline = null;

  var mainTimeoutId = null;

  var mainTimeExpired = false;

  var activeMainForm = null;

  var activeMainDialog = null;

  var visibilityHandler = null;


  // =========================================================
  // 5. CSS
  // =========================================================

  function addTaskStyles() {

    if (document.getElementById("calc-task-styles")) {
      return;
    }

    var style = document.createElement("style");

    style.id = "calc-task-styles";

    style.textContent = `

      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        min-height: 100%;
        background: #ffffff;
      }

      #display_stage.jspsych-display-element {
        display: block !important;
        width: 100%;
        height: auto !important;
        min-height: 100vh;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      #display_stage .jspsych-content-wrapper {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        flex: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      #display_stage #jspsych-content {
        display: block;
        width: min(900px, calc(100% - 40px));
        max-width: 900px;
        height: auto;
        margin: 0 auto !important;
        padding: 24px 0 32px 0;
        box-sizing: border-box;
      }


      /* =========================================
         タイトルページ・終了ページ
         ========================================= */

      .calc-start-page,
      .calc-end-message {
        display: block;
        width: fit-content;
        max-width: min(700px, calc(100% - 32px));
        margin: 0 auto;
        text-align: center;
        font-size: 25px;
        font-weight: 600;
        line-height: 1.8;
      }

      .calc-start-page {
        padding: 32px 16px;
      }

      .calc-start-page p {
        margin: 8px 0;
      }

      .calc-end-message p {
        margin: 8px 0;
      }

      #display_stage.calc-intro-active #jspsych-content,
      #display_stage.calc-end-active #jspsych-content {
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }

      #display_stage.calc-intro-active
      #jspsych-html-button-response-stimulus,

      #display_stage.calc-end-active
      #jspsych-html-button-response-stimulus {
        width: 100%;
        text-align: center;
      }

      #display_stage.calc-intro-active
      #jspsych-html-button-response-btngroup,

      #display_stage.calc-end-active
      #jspsych-html-button-response-btngroup {
        display: flex;
        justify-content: center;
        width: 100%;
        margin-top: 24px;
      }

      #display_stage.calc-intro-active .jspsych-btn,
      #display_stage.calc-end-active .jspsych-btn {
        margin: 0;
        background-color: #e8f1fb;
        color: #23486b;
        border: 1px solid #a9c3df;
        border-radius: 7px;
        padding: 11px 30px;
        font-size: 17px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      #display_stage.calc-intro-active .jspsych-btn:hover,
      #display_stage.calc-end-active .jspsych-btn:hover {
        background-color: #d5e6f7;
      }


      /* =========================================
         ルール確認・教示文ページ
         ========================================= */

      .calc-instruction {
        max-width: 760px;
        margin: 12px auto;
        padding: 22px;
        text-align: left;
        line-height: 1.8;
        font-size: 17px;
        background: #ffffff;
        border: 1px solid #dddddd;
        border-radius: 10px;
      }

      .calc-instruction h2 {
        margin: 0 0 14px 0;
        font-size: 23px;
        text-align: center;
      }

      .calc-instruction ul {
        padding-left: 1.5em;
      }

      .calc-instruction li {
        margin-bottom: 10px;
      }

      .calc-info-card {
        margin: 0 0 18px 0;
        padding: 17px 22px;
        border: 1px solid #d0d0d0;
        border-radius: 9px;
        background: #f7f7f7;
        text-align: left;
        font-size: 16px;
        line-height: 1.8;
      }


      /* =========================================
         計算式
         ========================================= */

      .calc-equation {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin: 45px auto 35px auto;
        font-size: clamp(27px, 5vw, 42px);
        font-weight: 600;
      }

      .calc-slot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 68px;
        height: 58px;
        padding: 0;
        border: 2px solid #777777;
        border-radius: 7px;
        background: #ffffff;
        color: #222222;
        font-size: 29px;
        font-weight: 600;
        line-height: 1;
        cursor: pointer;
      }

      .calc-slot.is-active {
        border: 3px solid #285f91;
        background: #edf5ff;
        box-shadow: 0 0 0 2px rgba(40, 95, 145, 0.13);
      }

      .calc-slot:focus-visible,
      .calc-operator-button:focus-visible {
        outline: 3px solid #9bbce5;
        outline-offset: 3px;
      }

      .calc-equation .calc-symbol {
        min-width: 18px;
        text-align: center;
      }


      /* =========================================
         演算子選択
         ========================================= */

      .calc-operator-picker {
        max-width: 600px;
        margin: 0 auto 28px auto;
        text-align: center;
      }

      .calc-operator-picker-label {
        margin-bottom: 11px;
        font-size: 17px;
        font-weight: 600;
      }

      .calc-operator-list {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .calc-operator-button {
        min-width: 62px;
        height: 54px;
        padding: 5px 13px;
        border: 1px solid #777777;
        border-radius: 8px;
        background: #ffffff;
        color: #222222;
        font-size: 27px;
        font-weight: 600;
        cursor: pointer;
      }

      .calc-operator-button:hover {
        background: #f0f4f8;
        border-color: #285f91;
      }

      .calc-picker-status {
        min-height: 1.6em;
        margin: 12px 0 0 0;
        color: #444444;
        font-size: 15px;
        line-height: 1.6;
      }


      /* =========================================
         本番問題・進捗表示
         ========================================= */

      .calc-main-preamble {
        max-width: 760px;
        margin: 18px auto 0 auto;
        text-align: left;
      }

      .calc-progress-label {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 8px;
        font-size: 17px;
        font-weight: 600;
      }

      .calc-progress-track {
        width: 100%;
        height: 13px;
        overflow: hidden;
        background: #e5e5e5;
        border-radius: 99px;
      }

      .calc-progress-fill {
        height: 100%;
        background: #356ca5;
        border-radius: 99px;
        transition: width 180ms ease;
      }

      .calc-main-note {
        margin-top: 18px;
        font-size: 16px;
        line-height: 1.7;
      }

      .calc-feedback-message {
        display: none;
        max-width: 720px;
        margin: 18px auto;
        padding: 12px 16px;
        color: #8a1c1c;
        background: #fff1f1;
        border: 1px solid #d99b9b;
        border-radius: 7px;
        font-size: 16px;
        text-align: left;
      }


      /* =========================================
         未回答確認ダイアログ
         ========================================= */

      .calc-dialog {
        width: min(520px, calc(100% - 40px));
        max-width: 520px;
        padding: 25px;
        border: 1px solid #999999;
        border-radius: 12px;
        box-shadow: 0 10px 35px rgba(0, 0, 0, 0.25);
        text-align: center;
      }

      .calc-dialog::backdrop {
        background: rgba(0, 0, 0, 0.45);
      }

      .calc-dialog-message {
        margin: 0 0 24px 0;
        font-size: 18px;
        line-height: 1.7;
      }

      .calc-dialog-buttons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .calc-dialog-buttons button {
        min-width: 145px;
        padding: 11px 17px;
        border: 1px solid #555555;
        border-radius: 7px;
        background: #ffffff;
        color: #222222;
        font-size: 16px;
        cursor: pointer;
      }

      .calc-dialog-buttons .calc-dialog-continue {
        color: #ffffff;
        background: #285f91;
        border-color: #285f91;
      }


      /* =========================================
         ボタン
         ========================================= */

      .jspsych-btn {
        margin-top: 16px;
        padding: 10px 24px;
        font-size: 17px;
      }


      /* =========================================
         スマートフォン
         ========================================= */

      @media (max-width: 600px) {

        #display_stage #jspsych-content {
          width: calc(100% - 28px);
          padding-top: 14px;
        }

        .calc-instruction {
          padding: 16px;
          font-size: 15px;
        }

        .calc-equation {
          gap: 5px;
          margin-top: 35px;
        }

        .calc-slot {
          width: 58px;
          height: 50px;
          font-size: 24px;
        }

        .calc-operator-button {
          min-width: 55px;
          height: 49px;
          font-size: 24px;
        }

        .calc-start-page,
        .calc-end-message {
          font-size: 21px;
        }

      }

    `;

    document.head.appendChild(style);
  }


  // =========================================================
  // 6. 共通関数
  // =========================================================

  function escapeHtml(value) {

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  }


  // ---------------------------------------------------------
  // 演算子欄を作る
  // ---------------------------------------------------------

  function makeOperatorSlot(name, positionLabel) {

    return (

      '<input type="hidden" name="' +
      name +
      '" id="' +
      name +
      '" value="">' +

      '<button type="button" class="calc-slot" ' +
      'data-field="' +
      name +
      '" aria-label="' +
      positionLabel +
      'の演算子欄。未選択" ' +
      'aria-pressed="false" ' +
      'title="演算子を入れる空欄"></button>'

    );

  }


  // ---------------------------------------------------------
  // 計算式を作る
  // ---------------------------------------------------------

  function makeEquationHtml(question) {

    var n = question.numbers;

    var operatorButtons = OPERATOR_OPTIONS.map(
      function (operator) {

        return (

          '<button type="button" ' +
          'class="calc-operator-button" ' +
          'data-operator="' +
          operator.value +
          '" aria-label="演算子 ' +
          operator.label +
          '">' +
          operator.label +
          '</button>'

        );

      }
    ).join("");


    return (

      '<div class="calc-equation" aria-label="計算問題">' +

        '<span class="calc-symbol">' +
        escapeHtml(n[0]) +
        '</span>' +

        makeOperatorSlot("op1", "1つ目") +

        '<span class="calc-symbol">' +
        escapeHtml(n[1]) +
        '</span>' +

        makeOperatorSlot("op2", "2つ目") +

        '<span class="calc-symbol">' +
        escapeHtml(n[2]) +
        '</span>' +

        makeOperatorSlot("op3", "3つ目") +

        '<span class="calc-symbol">' +
        escapeHtml(n[3]) +
        '</span>' +

        '<span class="calc-symbol">＝</span>' +

        '<span class="calc-symbol">' +
        escapeHtml(question.target) +
        '</span>' +

      '</div>' +

      '<div class="calc-operator-picker">' +

        '<div class="calc-operator-picker-label">' +
        '演算子一覧' +
        '</div>' +

        '<div class="calc-operator-list" ' +
        'aria-label="選択できる演算子">' +

          operatorButtons +

        '</div>' +

        '<p class="calc-picker-status" ' +
        'id="calc-picker-status" role="status" ' +
        'aria-live="polite">' +

          '空欄をクリックし、適切な演算子を選択してください。' +

        '</p>' +

      '</div>'

    );

  }


  // ---------------------------------------------------------
  // 演算子選択機能
  // ---------------------------------------------------------

  function bindOperatorPicker(form) {

    var selectedField = null;

    var fieldLabels = {
      op1: "1つ目",
      op2: "2つ目",
      op3: "3つ目"
    };

    var slots = Array.prototype.slice.call(
      form.querySelectorAll(".calc-slot[data-field]")
    );

    var operatorButtons = Array.prototype.slice.call(
      form.querySelectorAll(".calc-operator-button[data-operator]")
    );

    var status = form.querySelector("#calc-picker-status");


    function updateSlotDisplay(slot) {

      var fieldName = slot.getAttribute("data-field");

      var field = form.elements.namedItem(fieldName);

      var selectedOperator = field ? field.value : "";

      var operator = OPERATOR_OPTIONS.find(
        function (item) {
          return item.value === selectedOperator;
        }
      );

      slot.textContent = operator ? operator.label : "";

      slot.setAttribute(
        "aria-label",
        fieldLabels[fieldName] +
        "の演算子欄。" +
        (
          operator
            ? operator.label + "が選択されています"
            : "未選択"
        )
      );

      slot.setAttribute(
        "aria-pressed",
        selectedField === fieldName ? "true" : "false"
      );

      slot.classList.toggle(
        "is-active",
        selectedField === fieldName
      );

    }


    // 空欄をクリックした場合

    slots.forEach(function (slot) {

      slot.addEventListener("click", function () {

        selectedField = slot.getAttribute("data-field");

        slots.forEach(updateSlotDisplay);

        var currentValue =
          form.elements.namedItem(selectedField).value;

        var currentOperator = OPERATOR_OPTIONS.find(
          function (item) {
            return item.value === currentValue;
          }
        );

        if (status) {

          status.textContent =
            fieldLabels[selectedField] +
            "の空欄を選択中です。" +

            (
              currentOperator
                ? "現在は「" +
                  currentOperator.label +
                  "」です。演算子一覧から変更できます。"

                : "下の演算子一覧から演算子を選んでください。"
            );

        }

      });

    });


    // 演算子を選択した場合

    operatorButtons.forEach(function (button) {

      button.addEventListener("click", function () {

        if (!selectedField) {

          if (status) {
            status.textContent =
              "先に演算子を入れる空欄をクリックしてください。";
          }

          return;

        }

        var field =
          form.elements.namedItem(selectedField);

        var operatorValue =
          button.getAttribute("data-operator");

        var operator = OPERATOR_OPTIONS.find(
          function (item) {
            return item.value === operatorValue;
          }
        );

        if (!field || !operator) {
          return;
        }

        field.value = operator.value;

        field.dispatchEvent(
          new Event("change", { bubbles: true })
        );

        var activeSlot = slots.find(
          function (slot) {
            return (
              slot.getAttribute("data-field") === selectedField
            );
          }
        );

        if (activeSlot) {

          updateSlotDisplay(activeSlot);

          activeSlot.focus();

        }

        if (status) {

          status.textContent =
            fieldLabels[selectedField] +
            "の空欄に「" +
            operator.label +
            "」を入れました。" +
            "別の空欄をクリックすると、そこにも演算子を入れられます。";

        }

      });

    });


    return {

      focusFirstBlank: function () {

        var emptySlot = slots.find(
          function (slot) {

            var field = form.elements.namedItem(
              slot.getAttribute("data-field")
            );

            return field && field.value === "";

          }
        );

        var target = emptySlot || slots[0];

        if (target) {
          target.focus();
        }

      }

    };

  }


  // ---------------------------------------------------------
  // 選択された演算子を取得
  // ---------------------------------------------------------

  function getSelectedOperators(form) {

    return ["op1", "op2", "op3"].map(
      function (name) {

        var field = form.elements.namedItem(name);

        return field ? field.value : "";

      }
    );

  }


  // ---------------------------------------------------------
  // 選択数を数える
  // ---------------------------------------------------------

  function countSelected(operators) {

    return operators.filter(
      function (operator) {
        return operator !== "";
      }
    ).length;

  }


  // ---------------------------------------------------------
  // 3つすべて同じ演算子か
  // ---------------------------------------------------------

  function areAllThreeTheSame(operators) {

    return (

      operators.length === 3 &&

      operators[0] !== "" &&

      operators[0] === operators[1] &&

      operators[1] === operators[2]

    );

  }


  // ---------------------------------------------------------
  // 最初の未選択欄にフォーカス
  // ---------------------------------------------------------

  function focusFirstBlankSlot(form) {

    var slot = form.querySelector(
      '.calc-slot[data-field="op1"]'
    );

    var names = ["op1", "op2", "op3"];

    for (var i = 0; i < names.length; i++) {

      var field = form.elements.namedItem(names[i]);

      if (field && field.value === "") {

        slot = form.querySelector(
          '.calc-slot[data-field="' + names[i] + '"]'
        );

        break;

      }

    }

    if (slot) {
      slot.focus();
    }

  }


  // ---------------------------------------------------------
  // 現在のフォームを取得
  // ---------------------------------------------------------

  function getFormFromCurrentTrial() {

    return (

      document.querySelector("#jspsych-content form") ||

      document.querySelector("form")

    );

  }


  // ---------------------------------------------------------
  // フォーム送信
  // ---------------------------------------------------------

  function requestFormSubmit(form) {

    if (!form || !form.isConnected) {
      return;
    }

    if (typeof form.requestSubmit === "function") {

      form.requestSubmit();

    } else {

      var submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true
      });

      form.dispatchEvent(submitEvent);

    }

  }


  // =========================================================
  // 7. 制限時間の管理
  // =========================================================

  function clearMainTimer() {

    if (mainTimeoutId !== null) {

      window.clearTimeout(mainTimeoutId);

      mainTimeoutId = null;

    }

  }


  // ---------------------------------------------------------
  // ダイアログを閉じる
  // ---------------------------------------------------------

  function closeActiveMainDialog() {

    if (activeMainDialog && activeMainDialog.open) {

      activeMainDialog.close();

    }

    activeMainDialog = null;

  }


  // ---------------------------------------------------------
  // 制限時間終了時の処理
  // ---------------------------------------------------------

  function forceFinishMainTask() {

    if (mainTimeExpired) {
      return;
    }

    mainTimeExpired = true;

    clearMainTimer();

    closeActiveMainDialog();

    // 表示中の問題があれば、その時点の回答を確定する

    if (
      activeMainForm &&
      activeMainForm.isConnected
    ) {

      requestFormSubmit(activeMainForm);

    }

  }


  // ---------------------------------------------------------
  // タイマー開始
  // ---------------------------------------------------------

  function startMainTimer() {

    if (
      mainDeadline !== null ||
      mainTimeExpired
    ) {
      return;
    }

    mainDeadline =
      Date.now() + TASK_TIME_LIMIT_MS;


    mainTimeoutId = window.setTimeout(
      function () {

        forceFinishMainTask();

      },
      TASK_TIME_LIMIT_MS
    );


    // タブを非表示にしている間に制限時間を超えた場合

    visibilityHandler = function () {

      if (
        !document.hidden &&
        mainDeadline !== null &&
        Date.now() >= mainDeadline
      ) {

        forceFinishMainTask();

      }

    };

    document.addEventListener(
      "visibilitychange",
      visibilityHandler
    );

  }


  // ---------------------------------------------------------
  // タイマー停止
  // ---------------------------------------------------------

  function stopMainTimer() {

    clearMainTimer();

    if (visibilityHandler) {

      document.removeEventListener(
        "visibilitychange",
        visibilityHandler
      );

      visibilityHandler = null;

    }

    closeActiveMainDialog();

    activeMainForm = null;

  }


  // ---------------------------------------------------------
  // 次の問題を表示できるか
  // ---------------------------------------------------------

  function canShowNextMainQuestion() {

    if (mainTimeExpired) {
      return false;
    }

    if (
      mainDeadline !== null &&
      Date.now() >= mainDeadline
    ) {

      forceFinishMainTask();

      return false;

    }

    return true;

  }


  // =========================================================
  // 8. 未回答確認ダイアログ
  // =========================================================

  function createPartialAnswerDialog(
    message,
    onBack,
    onContinue
  ) {

    var dialog = document.createElement("dialog");

    dialog.className = "calc-dialog";

    dialog.setAttribute("aria-label", "回答の確認");


    var messageElement = document.createElement("p");

    messageElement.className = "calc-dialog-message";

    messageElement.textContent = message;


    var buttons = document.createElement("div");

    buttons.className = "calc-dialog-buttons";


    var backButton = document.createElement("button");

    backButton.type = "button";

    backButton.textContent = "回答に戻る";


    var continueButton = document.createElement("button");

    continueButton.type = "button";

    continueButton.className = "calc-dialog-continue";

    continueButton.textContent = "そのまま次へ進む";


    buttons.appendChild(backButton);

    buttons.appendChild(continueButton);

    dialog.appendChild(messageElement);

    dialog.appendChild(buttons);

    document.body.appendChild(dialog);


    backButton.addEventListener("click", function () {

      dialog.close();

      onBack();

    });


    continueButton.addEventListener("click", function () {

      dialog.close();

      onContinue();

    });


    dialog.addEventListener("close", function () {

      if (activeMainDialog === dialog) {
        activeMainDialog = null;
      }

      if (dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }

    });


    dialog.showModal();

    backButton.focus();

    return dialog;

  }


  // =========================================================
  // 9. 1ページ目：本番試行タイトルページ
  // =========================================================

  var introTrial = {

    type: HtmlButtonResponse,

    stimulus: `

      <div class="calc-start-page">

        <p>5．本番試行</p>

        <p>これから計算課題の本試行を行います。</p>

      </div>

    `,

    choices: ["次へ"],

    data: {

      task_phase: "main_intro",

      condition: CONDITION

    },

    on_load: function () {

      document.getElementById("display_stage")
        .classList.add("calc-intro-active");

    },

    on_finish: function () {

      document.getElementById("display_stage")
        .classList.remove("calc-intro-active");

    }

  };


  // =========================================================
  // 10. 2ページ目：ルールの再確認
  // =========================================================

  var ruleReviewTrial = {

    type: HtmlButtonResponse,

    stimulus: `

      <div class="calc-instruction">

        <h2>本番前のルール確認</h2>

        <ul>

          <li>
            空欄をクリックし、＋、－、×、÷から演算子を選択します。
          </li>

          <li>
            同じ演算子は複数回使えますが、
            3つすべてを同じ演算子にはできません。
          </li>

          <li>
            掛け算・割り算を先に計算し、
            同じ優先順位の計算は左から行います。
          </li>

          <li>
            すべて未選択ならスキップできます。
            1つまたは2つだけ選択して進む場合は確認画面が表示されます。
          </li>

          <li>
            次へ進んだ問題には戻れません。
          </li>

          <li>
            本番は全20問・制限時間10分です。
            残り時間は画面に表示されません。
          </li>

          <li>
            制限時間が終了した場合は、
            その時点で表示されている問題の回答を確定し、課題を終了します。
          </li>

        </ul>

        <p>
          <strong>
            次のページに表示される教示文を確認してから、
            本番課題に取り組んでください。
          </strong>
        </p>

        <p>
          制限時間の計測は、最初の本番問題が表示された時点から始まります。
        </p>

      </div>

    `,

    choices: ["教示文を確認する"],

    data: {

      task_phase: "rule_review",

      condition: CONDITION

    }

  };


  // =========================================================
  // 11. 3ページ目：別ファイルから教示文を表示
  // =========================================================

  var conditionInstructionTrial = {

    type: HtmlButtonResponse,

    stimulus: window.CALC_TASK_INSTRUCTION_HTML,

    choices: ["課題を開始する"],

    data: {

      task_phase: "condition_instruction",

      condition: CONDITION

    }

  };


  // =========================================================
  // 12. 本番問題1問分の作成
  // =========================================================

  function createMainTrial(question, order) {

    var progressPercent =
      (order / TOTAL_MAIN_QUESTIONS) * 100;


    var preamble = `

      <div class="calc-main-preamble">

        <div class="calc-progress-label">

          <span>本番問題</span>

          <strong>
            ${order} / ${TOTAL_MAIN_QUESTIONS}
          </strong>

        </div>

        <div
          class="calc-progress-track"
          role="progressbar"
          aria-label="本番課題の進捗"
          aria-valuemin="0"
          aria-valuemax="${TOTAL_MAIN_QUESTIONS}"
          aria-valuenow="${order}"
        >

          <div
            class="calc-progress-fill"
            style="width: ${progressPercent}%"
          ></div>

        </div>

        <p class="calc-main-note">

          空欄をクリックし、演算子一覧から演算子を選んでください。
          その後「次の問題へ」を押してください。<br>

          分からない場合は、3つとも未選択のまま進むとスキップできます。<br>

          スキップ、または未選択の空欄がある状態で次の問題へ進むと、
          確認画面が表示されます。

        </p>

      </div>

    `;


    var responseConfirmationConfirmed = false;

    var allowNextSubmit = false;

    var submitHandler = null;

    var mainFormForThisTrial = null;


    return {

      type: SurveyHtmlForm,

      data: {

        task_phase: "main",

        condition: CONDITION

      },

      preamble: preamble,

      html: makeEquationHtml(question),

      button_label:

        order === TOTAL_MAIN_QUESTIONS

          ? "回答を確定して課題を終了する"

          : "次の問題へ",


      // -----------------------------------------------------
      // 問題表示時
      // -----------------------------------------------------

      on_load: function () {

        var form = getFormFromCurrentTrial();

        if (!form) {

          console.error(
            "本番問題のフォームが見つかりません。"
          );

          return;

        }


        mainFormForThisTrial = form;

        activeMainForm = form;


        var operatorPicker =
          bindOperatorPicker(form);


        // 最初の問題が表示された時点でタイマー開始

        startMainTimer();


        // タイマー処理が遅れていた場合

        if (
          mainDeadline !== null &&
          Date.now() >= mainDeadline
        ) {

          forceFinishMainTask();

          return;

        }


        // 同一演算子3つのエラーメッセージ

        var sameOperatorMessage = null;


        ["op1", "op2", "op3"].forEach(
          function (name) {

            form.elements.namedItem(name)
              .addEventListener("change", function () {

                if (sameOperatorMessage) {

                  sameOperatorMessage.style.display = "none";

                }

              });

          }
        );


        // 送信前の確認処理

        submitHandler = function (event) {

          // 締切時刻を過ぎている場合

          if (
            !mainTimeExpired &&
            mainDeadline !== null &&
            Date.now() >= mainDeadline
          ) {

            mainTimeExpired = true;

            clearMainTimer();

            closeActiveMainDialog();

            return;

          }


          // 確認画面で続行を選択した後

          if (allowNextSubmit) {

            allowNextSubmit = false;

            closeActiveMainDialog();

            return;

          }


          // 時間切れ後はそのまま回答を確定

          if (mainTimeExpired) {

            closeActiveMainDialog();

            return;

          }


          var operators =
            getSelectedOperators(form);

          var selectedCount =
            countSelected(operators);


          // 3つすべてが同じ演算子の場合

          if (areAllThreeTheSame(operators)) {

            event.preventDefault();

            event.stopImmediatePropagation();


            if (!sameOperatorMessage) {

              sameOperatorMessage =
                document.createElement("div");

              sameOperatorMessage.className =
                "calc-feedback-message";

              sameOperatorMessage.setAttribute(
                "role",
                "alert"
              );

              form.appendChild(sameOperatorMessage);

            }


            sameOperatorMessage.textContent =
              "3つすべてを同じ演算子にすることはできません。" +
              "別の組み合わせを選択してください。";

            sameOperatorMessage.style.display = "block";

            focusFirstBlankSlot(form);

            return;

          }


          // 3つすべて選択されている場合

          if (selectedCount === 3) {
            return;
          }


          // 未選択または一部選択の場合

          event.preventDefault();

          event.stopImmediatePropagation();


          var message;


          if (selectedCount === 0) {

            message =
              "3つすべてが未選択です。" +
              "この問題をスキップして次へ進みますか？";

          } else {

            message =
              "未選択の空欄があります。" +
              "このまま次へ進みますか？";

          }


          activeMainDialog = createPartialAnswerDialog(

            message,

            // 回答に戻る

            function () {

              if (operatorPicker) {

                operatorPicker.focusFirstBlank();

              } else {

                focusFirstBlankSlot(form);

              }

            },


            // そのまま次へ進む

            function () {

              responseConfirmationConfirmed = true;

              allowNextSubmit = true;

              requestFormSubmit(form);

            }

          );

        };


        // capture=trueにして、プラグイン側より先に確認する

        form.addEventListener(
          "submit",
          submitHandler,
          true
        );

      },


      // -----------------------------------------------------
      // 問題回答後
      // -----------------------------------------------------

      on_finish: function (data) {


        // ------------------------------------------
        // 1. 回答内容を取得
        // ------------------------------------------

        var response = data.response || {};

        var operators = [

          response.op1 || "",

          response.op2 || "",

          response.op3 || ""

        ];

        var selectedCount =
          countSelected(operators);

        var allSame =
          areAllThreeTheSame(operators);

        var validComplete =
          selectedCount === 3 && !allSame;


        // ------------------------------------------
        // 2. 回答状態を判定
        // ------------------------------------------

        var responseStatus;


        if (mainTimeExpired) {

          responseStatus = "timeout_interrupted";

        } else if (selectedCount === 0) {

          if (responseConfirmationConfirmed) {

            responseStatus = "skipped_by_participant";

          } else {

            responseStatus = "blank_unconfirmed";

          }

        } else if (selectedCount < 3) {

          responseStatus = "partial_response";

        } else if (allSame) {

          responseStatus = "invalid_same_operator";

        } else {

          responseStatus = "complete_response";

        }


        // ------------------------------------------
        // 3. 分母に含める問題か判定
        // ------------------------------------------

        // 完答：含める
        // 部分回答：含める
        // 確定したスキップ：含める
        // 時間切れ時に1つ以上選択：含める
        // 時間切れ時に全て未選択：含めない

        var countedAsAttempted = (

          responseStatus === "complete_response" ||

          responseStatus === "partial_response" ||

          responseStatus === "skipped_by_participant" ||

          (
            responseStatus === "timeout_interrupted" &&
            selectedCount > 0
          )

        );


        // ------------------------------------------
        // 4. 参加者・問題情報
        // ------------------------------------------

        data.participant_id = PARTICIPANT_ID;

        data.condition = CONDITION;

        data.question_id = question.id;

        data.question_order = order;

        data.question_presented = 1;


        // ------------------------------------------
        // 5. 演算子の回答
        // ------------------------------------------

        data.op1 = operators[0];

        data.op2 = operators[1];

        data.op3 = operators[2];

        data.selected_operator_count = selectedCount;


        // ------------------------------------------
        // 6. 回答状態
        // ------------------------------------------

        data.response_status = responseStatus;

        data.counted_as_attempted =
          countedAsAttempted ? 1 : 0;

        data.is_attempted =
          selectedCount > 0 ? 1 : 0;

        data.valid_complete_response =
          responseStatus === "complete_response" ? 1 : 0;

        data.incomplete_response = (

          responseStatus === "partial_response" ||

          (
            responseStatus === "timeout_interrupted" &&
            selectedCount > 0
          )

        ) ? 1 : 0;

        data.skipped_by_participant =
          responseStatus === "skipped_by_participant" ? 1 : 0;

        data.all_same_operator =
          allSame ? 1 : 0;

        data.response_confirmation_confirmed =
          responseConfirmationConfirmed ? 1 : 0;


        // ------------------------------------------
        // 7. 問題ごとの回答時間
        // ------------------------------------------

        // jsPsychが測定した反応時間
        // 単位はミリ秒

        data.response_time_ms =
          typeof data.rt === "number"
            ? data.rt
            : null;


        // ------------------------------------------
        // 8. 時間切れ
        // ------------------------------------------

        data.time_limit_reached =
          mainTimeExpired ? 1 : 0;

        data.timeout_interrupted =
          mainTimeExpired ? 1 : 0;


        // ------------------------------------------
        // 9. 正誤
        // ------------------------------------------

        // 正答は参加者側のJavaScriptには含めない
        // 後から別途採点する

        data.correct = null;


        // ------------------------------------------
        // 10. イベント処理を解除
        // ------------------------------------------

        if (
          submitHandler &&
          mainFormForThisTrial
        ) {

          mainFormForThisTrial.removeEventListener(
            "submit",
            submitHandler,
            true
          );

        }

        closeActiveMainDialog();

        activeMainForm = null;

      }

    };

  }


  // =========================================================
  // 13. CSSの適用
  // =========================================================

  addTaskStyles();


  // =========================================================
  // 14. 本番問題の順番をランダム化
  // =========================================================

  // 参加者ごとに20問の順番を1回だけランダム化する
  // 促進条件・予防条件ともに同じ方法を使用する

  var randomizedQuestions =
    jsPsych.randomization.shuffle(
      MAIN_QUESTIONS.slice()
    );


  var mainQuestionTrials =
    randomizedQuestions.map(
      function (question, index) {

        return {

          timeline: [

            createMainTrial(
              question,
              index + 1
            )

          ],

          conditional_function: function () {

            return canShowNextMainQuestion();

          }

        };

      }
    );


  var mainBlock = {

    timeline: mainQuestionTrials,

    on_timeline_finish: function () {

      stopMainTimer();

    }

  };


  // =========================================================
  // 15. Qualtricsへ渡すデータを作成
  // =========================================================

  function buildCalcTaskExport() {


    var mainRows = jsPsych.data

      .get()

      .filter({
        task_phase: "main"
      })

      .values();


    // 実際に表示された問題をIDで整理

    var rowByQuestionId = {};


    mainRows.forEach(function (row) {

      rowByQuestionId[row.question_id] = row;

    });


    // ------------------------------------------
    // ランダム化された20問すべてを記録
    // ------------------------------------------

    var allTrials = randomizedQuestions.map(

      function (question, index) {

        var row = rowByQuestionId[question.id];


        // --------------------------------------
        // 時間切れなどで表示されなかった問題
        // --------------------------------------

        if (!row) {

          return {

            participant_id: PARTICIPANT_ID,

            condition: CONDITION,

            question_id: question.id,

            question_order: index + 1,

            question_presented: 0,

            op1: "",

            op2: "",

            op3: "",

            selected_operator_count: 0,

            response_status: "not_presented",

            response_time_ms: null,

            counted_as_attempted: 0,

            is_attempted: 0,

            valid_complete_response: 0,

            incomplete_response: 0,

            skipped_by_participant: 0,

            timeout_interrupted: 0,

            correct: null

          };

        }


        // --------------------------------------
        // 実際に表示された問題
        // --------------------------------------

        return {

          participant_id: PARTICIPANT_ID,

          condition: CONDITION,

          question_id: row.question_id,

          question_order: row.question_order,

          question_presented: 1,

          op1: row.op1 || "",

          op2: row.op2 || "",

          op3: row.op3 || "",

          selected_operator_count:
            row.selected_operator_count,

          response_status:
            row.response_status,

          response_time_ms:
            row.response_time_ms,

          counted_as_attempted:
            row.counted_as_attempted,

          is_attempted:
            row.is_attempted,

          valid_complete_response:
            row.valid_complete_response,

          incomplete_response:
            row.incomplete_response,

          skipped_by_participant:
            row.skipped_by_participant,

          timeout_interrupted:
            row.timeout_interrupted,

          correct: null

        };

      }

    );


    // ------------------------------------------
    // 集計対象となる問題
    // ------------------------------------------

    var countableTrials = allTrials.filter(

      function (row) {

        return row.counted_as_attempted === 1;

      }

    );


    // 有効な完答

    var completeTrials = countableTrials.filter(

      function (row) {

        return row.valid_complete_response === 1;

      }

    );


    // スキップ

    var skippedTrials = countableTrials.filter(

      function (row) {

        return row.skipped_by_participant === 1;

      }

    );


    // 一部回答

    var partialTrials = countableTrials.filter(

      function (row) {

        return row.incomplete_response === 1;

      }

    );


    // 時間切れで中断された問題

    var interruptedTrials = allTrials.filter(

      function (row) {

        return row.timeout_interrupted === 1;

      }

    );


    // 実際に表示された問題

    var presentedTrials = allTrials.filter(

      function (row) {

        return row.question_presented === 1;

      }

    );


    // 表示されなかった問題

    var notPresentedTrials = allTrials.filter(

      function (row) {

        return row.question_presented === 0;

      }

    );


    // ------------------------------------------
    // 平均回答時間
    // ------------------------------------------

    function calculateMean(values) {

      if (values.length === 0) {
        return null;
      }

      var total = values.reduce(

        function (sum, value) {

          return sum + value;

        },

        0

      );

      return Math.round(
        total / values.length
      );

    }


    var responseTimes = countableTrials

      .map(function (row) {

        return row.response_time_ms;

      })

      .filter(function (value) {

        return (
          typeof value === "number" &&
          Number.isFinite(value)
        );

      });


    // ------------------------------------------
    // スキップ率
    // ------------------------------------------

    var skipRate = countableTrials.length > 0

      ? skippedTrials.length /
        countableTrials.length * 100

      : null;


    // ------------------------------------------
    // 参加者ごとの集計
    // ------------------------------------------

    var summary = {

      participant_id: PARTICIPANT_ID,

      condition: CONDITION,

      total_questions: TOTAL_MAIN_QUESTIONS,

      presented_question_count:
        presentedTrials.length,

      not_presented_question_count:
        notPresentedTrials.length,

      interrupted_question_count:
        interruptedTrials.length,

      // スキップを含む、取り組み対象となった問題数

      countable_question_count:
        countableTrials.length,

      // スキップを除いて、何らかの回答をした問題数

      answered_question_count:
        countableTrials.length - skippedTrials.length,

      valid_complete_response_count:
        completeTrials.length,

      skipped_question_count:
        skippedTrials.length,

      incomplete_response_count:
        partialTrials.length,

      // 正答率の分母

      accuracy_denominator:
        countableTrials.length,

      // 正誤はデータ出力後に採点する

      correct_count: null,

      accuracy_percent: null,

      // スキップ率

      skip_rate_percent:
        skipRate === null
          ? null
          : Number(skipRate.toFixed(2)),

      // 回答時間の平均

      mean_response_time_ms:
        calculateMean(responseTimes),

      time_limit_reached:
        mainTimeExpired ? 1 : 0

    };


    // ------------------------------------------
    // 保存用データ全体
    // ------------------------------------------

    return {

      schema_version: "1.0",

      task_name: "calculation_task",

      participant_id: PARTICIPANT_ID,

      condition: CONDITION,

      total_questions: TOTAL_MAIN_QUESTIONS,

      planned_question_order:
        randomizedQuestions.map(

          function (question) {

            return question.id;

          }

        ),

      main_trials: allTrials,

      summary: summary,

      scoring_status: "pending_offline"

    };

  }


  // =========================================================
  // 16. 5ページ目：課題終了ページ
  // =========================================================

  var endTrial = {

    type: HtmlButtonResponse,

    stimulus: `

      <div class="calc-end-message">

        <p>以上で計算課題は終了です。</p>

        <p>お疲れさまでした。</p>

        <p>
          この後の質問への回答が、
          アンケートの最後となります。
        </p>

      </div>

    `,

    choices: ["次へ進む"],

    data: {

      task_phase: "end",

      condition: CONDITION

    },

    on_start: function () {

      stopMainTimer();

    },

    on_load: function () {

      document.getElementById("display_stage")
        .classList.add("calc-end-active");

    },

    on_finish: function () {

      document.getElementById("display_stage")
        .classList.remove("calc-end-active");

    }

  };


  // =========================================================
  // 17. 課題の実行
  // =========================================================

  var timeline = [

    introTrial,

    ruleReviewTrial,

    conditionInstructionTrial,

    mainBlock,

    endTrial

  ];


  // =========================================================
  // 18. Qualtrics側から呼び出せるように公開
  // =========================================================

  window.calcTaskTimeline = timeline;

  window.calcTaskExport = buildCalcTaskExport;


})();
