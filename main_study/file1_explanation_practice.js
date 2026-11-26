(function () {
  "use strict";

  // =========================================================
  // 1. jsPsychプラグインの確認
  // =========================================================

  const HtmlButtonResponse =
    window.jsPsychHtmlButtonResponse;

  if (typeof HtmlButtonResponse !== "function") {
    throw new Error(
      "jsPsychHtmlButtonResponseが読み込まれていません。" +
      "jsPsych本体とHTML Button Responseプラグインを確認してください。"
    );
  }


  // =========================================================
  // 2. 練習問題の設定
  // =========================================================

  const PRACTICE_QUESTION = {
    id: "PRACTICE",
    numbers: [9, 7, 3, 2],
    target: 8,
    answer: ["-", "+", "*"]
  };

  // 演算子の表示
  const OPERATOR_DISPLAY = {
    "+": "＋",
    "-": "－",
    "*": "×",
    "/": "÷"
  };

  // 演算子の選択肢
  const OPERATOR_OPTIONS = [
    { value: "+", label: "＋" },
    { value: "-", label: "－" },
    { value: "*", label: "×" },
    { value: "/", label: "÷" }
  ];


  // =========================================================
  // 3. 練習問題の回答状態
  // =========================================================

  let practiceSelectedOperators = ["", "", ""];

  let activeSlotIndex = -1;


  // =========================================================
  // 4. CSS
  // =========================================================

  function addTaskStyles() {

    if (document.getElementById("calc-task-file1-style")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "calc-task-file1-style";

    style.textContent = `

      /* -----------------------------------------------------
         全体
      ----------------------------------------------------- */

      #jspsych-content {
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
      }

      .calc-task-page {
        box-sizing: border-box;
        width: 100%;
        max-width: 800px;
        margin: 20px auto;
        padding: 36px 32px;
        background: #ffffff;
        border-radius: 10px;
        text-align: left;
        line-height: 1.8;
        color: #222222;
        font-size: 17px;
      }

      .calc-task-page h1 {
        margin: 0 0 24px;
        font-size: 25px;
        text-align: center;
      }

      .calc-task-page h2 {
        margin: 28px 0 12px;
        font-size: 20px;
      }

      .calc-task-page p {
        margin: 12px 0;
      }

      .calc-task-page ul {
        padding-left: 1.6em;
      }

      .calc-task-page li {
        margin: 8px 0;
      }


      /* -----------------------------------------------------
         開始画面
      ----------------------------------------------------- */

      .calc-start-page {
        min-height: 350px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
      }

      .calc-start-page h1 {
        font-size: 27px;
        margin-bottom: 24px;
      }

      .calc-start-page p {
        text-align: center;
      }


      /* -----------------------------------------------------
         課題説明
      ----------------------------------------------------- */

      .calc-instruction-page {
        text-align: left;
      }

      .calc-instruction-box {
        margin: 18px 0;
        padding: 18px 22px;
        background: #f5f6f8;
        border-radius: 8px;
      }

      .calc-instruction-box p:first-child {
        margin-top: 0;
      }

      .calc-instruction-box p:last-child {
        margin-bottom: 0;
      }

      .calc-instruction-note {
        margin-top: 18px;
        padding: 14px 18px;
        border-left: 4px solid #777777;
        background: #f7f7f7;
      }


      /* -----------------------------------------------------
         練習問題
      ----------------------------------------------------- */

      .calc-practice-page {
        text-align: center;
      }

      .calc-practice-description {
        margin-bottom: 24px;
      }

      .calc-equation {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 10px;
        margin: 35px auto 28px;
        font-size: 30px;
        font-weight: bold;
      }

      .calc-number {
        min-width: 28px;
      }

      .calc-equals {
        margin: 0 8px;
      }

      .calc-target {
        min-width: 28px;
      }

      .calc-operator-slot {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 56px;
        height: 56px;
        padding: 0;
        border: 2px solid #777777;
        border-radius: 7px;
        background: #ffffff;
        color: #222222;
        font-size: 29px;
        font-weight: bold;
        cursor: pointer;
      }

      .calc-operator-slot:hover {
        background: #f0f2f5;
      }

      .calc-operator-slot.is-active {
        border: 3px solid #3569a8;
        background: #edf4fc;
      }

      .calc-operator-slot.is-selected {
        border-color: #777777;
        background: #f5f6f8;
      }

      .calc-picker-label {
        margin: 20px 0 10px;
        font-weight: bold;
      }

      .calc-operator-picker {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
        margin: 12px auto 24px;
      }

      .calc-operator-picker[hidden] {
        display: none !important;
      }

      .calc-operator-choice {
        width: 58px;
        height: 52px;
        border: 1px solid #888888;
        border-radius: 7px;
        background: #ffffff;
        color: #222222;
        font-size: 25px;
        cursor: pointer;
      }

      .calc-operator-choice:hover {
        background: #edf4fc;
        border-color: #3569a8;
      }

      .calc-practice-hint {
        margin: 16px 0;
        color: #555555;
        font-size: 15px;
      }

      .calc-practice-error {
        min-height: 28px;
        margin: 15px 0;
        color: #b3261e;
        font-weight: bold;
      }


      /* -----------------------------------------------------
         正解・解説
      ----------------------------------------------------- */

      .calc-answer-page {
        text-align: center;
      }

      .calc-answer-equation {
        margin: 24px 0;
        font-size: 30px;
        font-weight: bold;
      }

      .calc-answer-box {
        margin: 22px auto;
        padding: 18px 22px;
        background: #f5f6f8;
        border-radius: 8px;
        text-align: left;
      }

      .calc-answer-box p {
        margin: 8px 0;
      }


      /* -----------------------------------------------------
         jsPsychのボタン
      ----------------------------------------------------- */

      .jspsych-btn {
        margin: 24px 5px 10px;
        padding: 12px 28px;
        border: none;
        border-radius: 7px;
        background: #dce8f5;
        color: #222222;
        font-size: 17px;
        cursor: pointer;
      }

      .jspsych-btn:hover {
        background: #c8dbee;
      }


      /* -----------------------------------------------------
         スマートフォン対応
      ----------------------------------------------------- */

      @media (max-width: 600px) {

        .calc-task-page {
          padding: 24px 16px;
          font-size: 15px;
        }

        .calc-task-page h1 {
          font-size: 22px;
        }

        .calc-equation {
          gap: 5px;
          font-size: 24px;
        }

        .calc-operator-slot {
          width: 45px;
          height: 45px;
          font-size: 24px;
        }

        .calc-answer-equation {
          font-size: 24px;
        }

        .jspsych-btn {
          padding: 11px 20px;
          font-size: 16px;
        }
      }

    `;

    document.head.appendChild(style);
  }


  // =========================================================
  // 5. 共通関数
  // =========================================================

  function escapeHtml(value) {

    return String(value).replace(/[&<>"']/g, function (char) {

      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return replacements[char];

    });

  }


  // ---------------------------------------------------------
  // 演算子の表示文字を取得
  // ---------------------------------------------------------

  function displayOperator(operator) {

    // 未選択の場合は空文字を返す
    return OPERATOR_DISPLAY[operator] || "";

  }


  // ---------------------------------------------------------
  // 演算子を選択する空欄
  // ---------------------------------------------------------

  function makeOperatorSlot(index) {

    return `
      <button
        type="button"
        class="calc-operator-slot"
        data-slot="${index}"
        aria-label="演算子${index + 1}を選択"
      ></button>
    `;

  }


  // ---------------------------------------------------------
  // 計算式のHTMLを作成
  // ---------------------------------------------------------

  function makeEquationHtml(question) {

    let equationHtml = "";

    question.numbers.forEach(function (number, index) {

      equationHtml += `
        <span class="calc-number">
          ${escapeHtml(number)}
        </span>
      `;

      if (index < 3) {
        equationHtml += makeOperatorSlot(index);
      }

    });

    equationHtml += `
      <span class="calc-equals">＝</span>
      <span class="calc-target">
        ${escapeHtml(question.target)}
      </span>
    `;

    return `
      <div
        id="calc-practice-equation"
        class="calc-equation"
      >
        ${equationHtml}
      </div>
    `;

  }


  // ---------------------------------------------------------
  // 選択済み演算子を取得
  // ---------------------------------------------------------

  function getSelectedOperators() {

    return practiceSelectedOperators.slice();

  }


  // ---------------------------------------------------------
  // 選択済みの演算子数を取得
  // ---------------------------------------------------------

  function countSelected() {

    return practiceSelectedOperators.filter(function (operator) {
      return operator !== "";
    }).length;

  }


  // ---------------------------------------------------------
  // 3つの演算子がすべて同じか確認
  // ---------------------------------------------------------

  function areAllThreeTheSame(operators) {

    return (
      operators.length === 3 &&
      operators.every(function (operator) {
        return operator === operators[0];
      })
    );

  }


  // ---------------------------------------------------------
  // 次に入力する空欄を探す
  // ---------------------------------------------------------

  function focusFirstBlankSlot() {

    return practiceSelectedOperators.findIndex(function (operator) {
      return operator === "";
    });

  }


  // =========================================================
  // 6. 練習問題の演算子選択機能
  // =========================================================

  function renderPracticeSlots() {

    const slots = document.querySelectorAll(
      "#calc-practice-equation .calc-operator-slot"
    );

    slots.forEach(function (slot, index) {

      const selectedOperator = practiceSelectedOperators[index];

      slot.textContent = displayOperator(selectedOperator);

      slot.classList.toggle(
        "is-selected",
        selectedOperator !== ""
      );

      slot.classList.toggle(
        "is-active",
        index === activeSlotIndex
      );

      slot.setAttribute(
        "aria-pressed",
        String(index === activeSlotIndex)
      );

      slot.setAttribute(
        "aria-label",
        selectedOperator
          ? `演算子${index + 1}：${displayOperator(selectedOperator)}。変更する`
          : `演算子${index + 1}を選択`
      );

    });

  }


  // ---------------------------------------------------------
  // 演算子選択機能を設定
  // ---------------------------------------------------------

  function bindOperatorPicker() {

    const equation = document.getElementById(
      "calc-practice-equation"
    );

    const picker = document.getElementById(
      "calc-practice-picker"
    );

    if (!equation || !picker) {
      return;
    }


    // 空欄をクリックしたとき

    equation.addEventListener("click", function (event) {

      const slot = event.target.closest(".calc-operator-slot");

      if (!slot) {
        return;
      }

      activeSlotIndex = Number(slot.dataset.slot);

      renderPracticeSlots();

      picker.hidden = false;

    });


    // 演算子を選択したとき

    picker.addEventListener("click", function (event) {

      const choice = event.target.closest(
        ".calc-operator-choice"
      );

      if (!choice) {
        return;
      }

      if (activeSlotIndex < 0 || activeSlotIndex > 2) {
        return;
      }

      const selectedOperator = choice.dataset.operator;

      if (!OPERATOR_DISPLAY[selectedOperator]) {
        return;
      }

      practiceSelectedOperators[activeSlotIndex] =
        selectedOperator;

      // 次の空欄をアクティブにする

      activeSlotIndex = focusFirstBlankSlot();

      // 表示を更新

      renderPracticeSlots();

      // 演算子選択欄を閉じる

      picker.hidden = true;

    });


    renderPracticeSlots();

  }


  // =========================================================
  // 7. 練習問題の回答チェック
  // =========================================================

  function bindPracticeValidation() {

    const submitButton =
      document.querySelector(
        "#jspsych-html-button-response-btngroup .jspsych-btn"
      ) ||
      document.querySelector(".jspsych-btn");

    const errorMessage = document.getElementById(
      "calc-practice-error"
    );

    if (!submitButton || !errorMessage) {
      return;
    }


    // 回答ボタンが押されたときに確認する

    submitButton.addEventListener(
      "click",
      function (event) {

        const operators = getSelectedOperators();

        let errorText = "";


        // 3つすべて選択されているか

        if (countSelected() !== 3) {

          errorText =
            "3つすべての□に演算子を選択してください。";

        }


        // 3つとも同じ演算子になっていないか

        else if (areAllThreeTheSame(operators)) {

          errorText =
            "3つとも同じ演算子になっています。選択を見直してください。";

        }


        // 入力に不備がある場合

        if (errorText !== "") {

          event.preventDefault();

          event.stopImmediatePropagation();

          errorMessage.textContent = errorText;

          const firstBlank = focusFirstBlankSlot();

          if (firstBlank >= 0) {
            activeSlotIndex = firstBlank;
            renderPracticeSlots();
          }

        }

      },
      true
    );

  }


  // =========================================================
  // 8. 課題開始画面
  // =========================================================

  const introTrial = {

    type: HtmlButtonResponse,

    stimulus: `

      <div class="calc-task-page calc-start-page">

        <h1>計算課題（練習）</h1>

        <p>
          はじめに課題の説明が表示されます。
        </p>

        <p>
          説明をしっかり読んだうえで、練習問題に取り組んでください。
        </p>

      </div>

    `,

    choices: [
      "課題説明へ進む"
    ]

  };


  // =========================================================
  // 9. 課題説明
  // =========================================================

  const instructionTrial = {

    type: HtmlButtonResponse,

    stimulus: `

      <div class="calc-task-page calc-instruction-page">

        <h1>課題の説明</h1>

        <p>
          これから、数字と計算記号を用いた計算課題に取り組んでいただきます。
        </p>

        <h2>回答方法</h2>

        <div class="calc-instruction-box">

          <p>
            画面には、数字と3つの空欄（□）からなる不完全な等式が表示されます。
            <strong>空欄には、演算子が入ります。</strong>
          </p>

          <p>
            等式が成立するように、3つの空欄をクリックし、
            次の4種類の演算子から1つずつ選択してください。
            同じ演算子は複数回使えます。
            ただし、<strong>3つすべてを同じ演算子にはできません。</strong>
          </p>

          <p style="text-align:center; font-size:24px; font-weight:bold;">
            <strong>＋　－　×　÷</strong>
          </p>

          <p>
            4つの数字の順序は変更できません。
            また、括弧は使用できません。
          </p>

        </div>


        <h2>計算上のルール</h2>

        <div class="calc-instruction-box">

          <ul>
            <li>
              掛け算（×）と割り算（÷）を先に計算してください。
            </li>

            <li>
              足し算（＋）と引き算（－）は左から順に計算してください。
            </li>

            <li>
              割り算（÷）を使用する場合は、割り切れる組み合わせにしてください。
            </li>

            <li>
              計算途中で負の数にならないようにしてください。
            </li>
          </ul>

        </div>


        <h2>本番の課題について</h2>

        <div class="calc-instruction-box">

          <p>
            本番では、全部で20問に取り組んでいただきます。
          </p>

          <p>
            制限時間は10分です。
          </p>

          <p>
            問題は参加者ごとに異なる順序で表示されます。
          </p>

        </div>


        <div class="calc-instruction-note">

          <p>
            まずは次の練習問題で、回答方法を確認してください。
          </p>

        </div>

      </div>

    `,

    choices: [
      "練習問題へ進む"
    ]

    </div>
    
  };


  // =========================================================
  // 10. 練習問題
  // =========================================================

  const practiceTrial = {

    type: HtmlButtonResponse,

    stimulus: function () {

      return `

        <div class="calc-task-page calc-practice-page">

          <h1>練習問題</h1>

          <p class="calc-practice-description">
            次の式が成り立つように、3つの□に演算子を選択してください。
          </p>

          ${makeEquationHtml(PRACTICE_QUESTION)}

          <p class="calc-picker-label">
            演算子を選択してください。
          </p>

          <div
            id="calc-practice-picker"
            class="calc-operator-picker"
            hidden
          >

            ${OPERATOR_OPTIONS.map(function (option) {

              return `
                <button
                  type="button"
                  class="calc-operator-choice"
                  data-operator="${option.value}"
                >
                  ${option.label}
                </button>
              `;

            }).join("")}

          </div>


          <p class="calc-practice-hint">
            空欄をクリックすると、演算子を選択できます。
            選択した演算子を変更する場合は、
            もう一度その空欄をクリックしてください。
          </p>


          <p
            id="calc-practice-error"
            class="calc-practice-error"
            aria-live="polite"
          ></p>

        </div>

      `;

    },


    choices: [
      "回答を確定する"
    ],


    // 練習問題を開始するとき

    on_start: function () {

      practiceSelectedOperators = ["", "", ""];

      activeSlotIndex = -1;

    },


    // 画面が表示されたとき

    on_load: function () {

      bindOperatorPicker();

      bindPracticeValidation();

    },


    // 練習問題の回答を保存

    on_finish: function (data) {

      const operators = getSelectedOperators();

      data.question_id = PRACTICE_QUESTION.id;

      data.question_numbers =
        PRACTICE_QUESTION.numbers.slice();

      data.question_target =
        PRACTICE_QUESTION.target;

      data.practice_operators =
        operators.slice();

      data.practice_selected_count =
        countSelected();

      data.practice_answer_correct =
        operators.every(function (operator, index) {

          return operator === PRACTICE_QUESTION.answer[index];

        });

    }

  };


  // =========================================================
  // 11. 練習問題の正解・解説
  // =========================================================

  const practiceAnswerTrial = {

    type: HtmlButtonResponse,

    stimulus: function () {

      const selectedOperators = getSelectedOperators();

      const selectedExpression =
        PRACTICE_QUESTION.numbers.map(function (number, index) {

          let result = String(number);

          if (index < 3) {

            result +=
              " " +
              displayOperator(selectedOperators[index]) +
              " ";

          }

          return result;

        }).join("") +
        " ＝ " +
        PRACTICE_QUESTION.target;


      return `

        <div class="calc-task-page calc-answer-page">

          <h1>練習問題の正解と解説</h1>

          <h2>あなたの回答</h2>

          <div class="calc-answer-equation">
            ${escapeHtml(selectedExpression)}
          </div>


          <h2>正解</h2>

          <div class="calc-answer-equation">
            9 － 7 ＋ 3 × 2 ＝ 8
          </div>


          <div class="calc-answer-box">

            <p>
              この問題の正解は、
              <strong>9 － 7 ＋ 3 × 2 ＝ 8</strong>
              です。
            </p>

            <p>
              掛け算と割り算は、足し算と引き算より先に計算します。
            </p>

            <p>
              そのため、まず 3 × 2 ＝ 6 を計算します。
            </p>

            <p>
              次に、9 － 7 ＋ 6 を左から順に計算します。
            </p>

            <p>
              9 － 7 ＝ 2、2 ＋ 6 ＝ 8 となります。
            </p>

          </div>


          <p>
            以上で練習問題は終了です。
          </p>

          <p>
            次は、質問紙に回答していただきます。
          </p>

        </div>

      `;

    },


    choices: [
      "課題説明完了画面へ進む"
    ]

  };


  // =========================================================
  // 12. 課題説明・練習試行の完了画面
  // =========================================================

  const completionTrial = {

    type: HtmlButtonResponse,

    stimulus: `

      <div class="calc-task-page calc-answer-page">

        <h1>課題説明・練習試行は終了です</h1>

        <p>
          これで、計算課題の説明と練習問題はすべて終了しました。
        </p>

        <div class="calc-answer-box">

          <p>
            次へ進むと、質問紙に回答していただきます。
          </p>

          <p>
            内容を確認したら、下のボタンを押してください。
          </p>

        </div>

      </div>

    `,

    choices: [
      "次へ進む"
    ]

  };


  // =========================================================
  // 13. タイムラインの作成
  // =========================================================

  addTaskStyles();

  const timeline = [
    introTrial,
    instructionTrial,
    practiceTrial,
    practiceAnswerTrial,
    completionTrial
  ];


  // =========================================================
  // 14. Qualtrics側から参照するための公開
  // =========================================================

  window.calcTaskTimeline = timeline;

  console.log(
    "ファイル1：課題説明＋練習試行のタイムラインを準備しました。"
  );

})();
