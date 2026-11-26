(function () {
  "use strict";

  // =========================================================
  // 1. 実験条件の取得
  // =========================================================

  // Qualtricsから受け取る値
  // "promotion" または "prevention"

  var CONDITION = String(
    window.CALC_CONDITION 
  ).toLowerCase();

  if (
    CONDITION !== "promotion" &&
    CONDITION !== "prevention"
  ) {
    throw new Error(
      "実験条件が正しく設定されていません。"
    );
  }

  window.CALC_CONDITION = CONDITION;


  // =========================================================
  // 2. 条件ごとの教示文
  // =========================================================

  // 促進条件
  // ※確定した促進条件の教示文に置き換える

  var PROMOTION_INSTRUCTION_TEXT = `
ここに促進条件の教示文を入力してください。
`;


  // 予防条件
  // ※確定した予防条件の教示文に置き換える

  var PREVENTION_INSTRUCTION_TEXT = `
ここに予防条件の教示文を入力してください。
`;


  // =========================================================
  // 3. HTML用の文字列処理
  // =========================================================

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }


  // =========================================================
  // 4. 表示する教示文を選択
  // =========================================================

  var selectedInstruction;

  if (CONDITION === "promotion") {
    selectedInstruction = PROMOTION_INSTRUCTION_TEXT;
  } else {
    selectedInstruction = PREVENTION_INSTRUCTION_TEXT;
  }

  var instructionHtml = escapeHtml(
    selectedInstruction.trim()
  ).replace(/\r?\n/g, "<br>");


  // =========================================================
  // 5. 教示文ページのHTML
  // =========================================================

  window.CALC_TASK_INSTRUCTION_HTML = `

    <div class="calc-instruction">

      <h2>本番課題への取り組みについて</h2>

      <p>
        以下の内容を確認してください。
      </p>

      <div class="calc-info-card">

        <p>
          ${instructionHtml}
        </p>

      </div>

      <p>
        内容を確認したら、ボタンを押して本番課題を開始してください。
      </p>

    </div>

  `;

})();
