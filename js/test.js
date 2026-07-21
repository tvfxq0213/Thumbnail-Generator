/**
 * 월간 일본어 복습 테스트 생성기
 * Vanilla JS — A4 미리보기 + html2pdf.js PDF 저장
 */

/* ==========================================================================
   DOM References
   ========================================================================== */

const dom = {
  reviewMonth: document.getElementById("reviewMonth"),

  wordTestEntries: document.getElementById("wordTestEntries"),
  addWordTestBtn: document.getElementById("addWordTestBtn"),
  wordTestJsonInput: document.getElementById("wordTestJsonInput"),
  applyWordTestJsonBtn: document.getElementById("applyWordTestJsonBtn"),
  fillBlankEntries: document.getElementById("fillBlankEntries"),
  addFillBlankBtn: document.getElementById("addFillBlankBtn"),
  translateEntries: document.getElementById("translateEntries"),
  addTranslateBtn: document.getElementById("addTranslateBtn"),
  composeEntries: document.getElementById("composeEntries"),
  addComposeBtn: document.getElementById("addComposeBtn"),

  testSheet: document.getElementById("testSheet"),
  previewTitle: document.getElementById("previewTitle"),
  wordTestSection: document.getElementById("wordTestSection"),
  previewWordTests: document.getElementById("previewWordTests"),
  fillBlankDivider: document.getElementById("fillBlankDivider"),
  fillBlankSection: document.getElementById("fillBlankSection"),
  previewFillBlanks: document.getElementById("previewFillBlanks"),
  translateDivider: document.getElementById("translateDivider"),
  translateSection: document.getElementById("translateSection"),
  previewTranslates: document.getElementById("previewTranslates"),
  composeDivider: document.getElementById("composeDivider"),
  composeSection: document.getElementById("composeSection"),
  previewComposes: document.getElementById("previewComposes"),

  savePdfBtn: document.getElementById("savePdfBtn"),
  loadingOverlay: document.getElementById("loadingOverlay"),
};

const CIRCLED_NUMBERS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

/* ==========================================================================
   State
   ========================================================================== */

const wordTests = [{ prompt: "" }];
const fillBlanks = [{ sentence: "", hint: "" }];
const translates = [{ sentence: "" }];
const composes = [{ prompt: "" }];

/* ==========================================================================
   Shared Helpers
   ========================================================================== */

/** n번째 항목의 원문자 번호를 반환한다 (21 이상은 "N."로 대체) */
function circledNumber(n) {
  return n <= CIRCLED_NUMBERS.length ? CIRCLED_NUMBERS[n - 1] : `${n}.`;
}

/** 라벨 + input 한 줄을 생성한다 */
function createFieldGroup({ labelText, value, placeholder, maxlength, extraClass, onInput }) {
  const group = document.createElement("div");
  group.className = "form__group";

  const label = document.createElement("label");
  label.className = "form__label";
  label.textContent = labelText;
  group.appendChild(label);

  const input = document.createElement("input");
  input.className = `form__input ${extraClass || ""}`.trim();
  input.type = "text";
  input.value = value;
  input.placeholder = placeholder;
  input.maxLength = maxlength;
  input.addEventListener("input", () => onInput(input.value));
  group.appendChild(input);

  return group;
}

/** 라벨 + textarea 한 줄을 생성한다 */
function createTextareaGroup({ labelText, value, placeholder, extraClass, onInput }) {
  const group = document.createElement("div");
  group.className = "form__group";

  const label = document.createElement("label");
  label.className = "form__label";
  label.textContent = labelText;
  group.appendChild(label);

  const textarea = document.createElement("textarea");
  textarea.className = `form__input form__textarea ${extraClass || ""}`.trim();
  textarea.rows = 2;
  textarea.value = value;
  textarea.placeholder = placeholder;
  textarea.addEventListener("input", () => onInput(textarea.value));
  group.appendChild(textarea);

  return group;
}

/** 항목 카드의 헤더(번호 라벨 + 삭제 버튼)를 생성한다 */
function createEntryHeader({ labelText, canRemove, onRemove }) {
  const header = document.createElement("div");
  header.className = "repeat-entry__header";

  const label = document.createElement("span");
  label.className = "repeat-entry__label";
  label.textContent = labelText;
  header.appendChild(label);

  if (canRemove) {
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "repeat-entry__remove";
    removeBtn.setAttribute("aria-label", `${labelText} 삭제`);
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", onRemove);
    header.appendChild(removeBtn);
  }

  return header;
}

/** 손으로 답을 적을 빈 줄을 생성한다 */
function createBlankLine() {
  const line = document.createElement("div");
  line.className = "test-blank-line";
  return line;
}

/**
 * 반복 입력 목록(단어 시험 / 빈칸 채우기 / 해석 / 작문)의 폼 렌더링을 일반화한다.
 * @param {object} opts
 * @param {HTMLElement} opts.container 입력 카드가 들어갈 컨테이너
 * @param {Array<object>} opts.items 상태 배열
 * @param {string} opts.labelPrefix 카드 라벨 접두사 (예: "문제")
 * @param {(item: object, index: number) => HTMLElement[]} opts.fields 카드 내부 필드 생성 함수
 */
function renderRepeatList({ container, items, labelPrefix, fields }) {
  container.innerHTML = "";

  items.forEach((item, index) => {
    const entry = document.createElement("div");
    entry.className = "repeat-entry";

    entry.appendChild(
      createEntryHeader({
        labelText: `${labelPrefix} ${index + 1}`,
        canRemove: items.length > 1,
        onRemove: () => {
          items.splice(index, 1);
          renderAllForms();
          updatePreview();
        },
      })
    );

    fields(item, index).forEach((field) => entry.appendChild(field));

    container.appendChild(entry);
  });
}

/* ==========================================================================
   Form Rendering
   ========================================================================== */

/** JSON 항목 하나를 단어 시험 문제(prompt)로 정규화한다 (문자열/객체 모두 허용) */
function normalizeWordTestItem(raw) {
  if (typeof raw === "string") {
    const prompt = raw.trim();
    return prompt ? { prompt } : null;
  }

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const prompt = String(raw.prompt ?? raw.word ?? raw.단어 ?? raw.뜻 ?? raw["문제"] ?? "").trim();
  return prompt ? { prompt } : null;
}

/** JSON 붙여넣기 입력을 파싱해 단어 시험 문제 목록 전체를 교체한다 */
function applyWordTestJson() {
  let parsed;
  try {
    parsed = JSON.parse(dom.wordTestJsonInput.value);
  } catch (err) {
    alert("JSON 형식이 올바르지 않습니다. 문법을 확인해 주세요.");
    return;
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  const normalized = list.map(normalizeWordTestItem).filter(Boolean);

  if (normalized.length === 0) {
    alert("가져올 수 있는 문제 항목이 없습니다.");
    return;
  }

  wordTests.length = 0;
  wordTests.push(...normalized);
  renderWordTestEntries();
  updatePreview();
}

function renderWordTestEntries() {
  renderRepeatList({
    container: dom.wordTestEntries,
    items: wordTests,
    labelPrefix: "문제",
    fields: (item) => [
      createFieldGroup({
        labelText: "문제 (뜻 또는 단어)",
        value: item.prompt,
        placeholder: "예: 개화, 꽃이 핌",
        maxlength: 60,
        onInput: (value) => {
          item.prompt = value;
          updatePreview();
        },
      }),
    ],
  });
}

function renderFillBlankEntries() {
  renderRepeatList({
    container: dom.fillBlankEntries,
    items: fillBlanks,
    labelPrefix: "문제",
    fields: (item) => [
      createTextareaGroup({
        labelText: "문장 (빈칸 포함, 예: ___)",
        value: item.sentence,
        placeholder: "例: 桜の___はいつですか。",
        extraClass: "form__textarea--jp",
        onInput: (value) => {
          item.sentence = value;
          updatePreview();
        },
      }),
      createFieldGroup({
        labelText: "힌트 (선택)",
        value: item.hint,
        placeholder: "예: 꽃이 피는 것을 의미하는 단어",
        maxlength: 60,
        onInput: (value) => {
          item.hint = value;
          updatePreview();
        },
      }),
    ],
  });
}

function renderTranslateEntries() {
  renderRepeatList({
    container: dom.translateEntries,
    items: translates,
    labelPrefix: "문제",
    fields: (item) => [
      createTextareaGroup({
        labelText: "일본어 문장",
        value: item.sentence,
        placeholder: "例: 梅雨明けはいつですか。",
        extraClass: "form__textarea--jp",
        onInput: (value) => {
          item.sentence = value;
          updatePreview();
        },
      }),
    ],
  });
}

function renderComposeEntries() {
  renderRepeatList({
    container: dom.composeEntries,
    items: composes,
    labelPrefix: "문제",
    fields: (item) => [
      createTextareaGroup({
        labelText: "작문 주제 / 조건",
        value: item.prompt,
        placeholder: "예: '~ようになる'를 사용해서 한 문장을 작문하세요.",
        onInput: (value) => {
          item.prompt = value;
          updatePreview();
        },
      }),
    ],
  });
}

/** 모든 반복 입력 폼을 다시 그린다 (항목 추가/삭제 시 사용) */
function renderAllForms() {
  renderWordTestEntries();
  renderFillBlankEntries();
  renderTranslateEntries();
  renderComposeEntries();
}

/* ==========================================================================
   Preview Module
   ========================================================================== */

/** ① 단어 시험 미리보기를 렌더링한다 (2열 그리드, 빈 항목은 제외) */
function renderPreviewWordTests() {
  const entries = wordTests.map((item) => item.prompt.trim()).filter(Boolean);

  dom.wordTestSection.hidden = entries.length === 0;
  dom.previewWordTests.innerHTML = "";

  entries.forEach((prompt, index) => {
    const item = document.createElement("div");
    item.className = "test-word-item";

    const num = document.createElement("span");
    num.className = "test-word-item__num";
    num.textContent = circledNumber(index + 1);
    item.appendChild(num);

    const promptEl = document.createElement("span");
    promptEl.className = "test-word-item__prompt";
    promptEl.textContent = prompt;
    item.appendChild(promptEl);

    item.appendChild(createBlankLine());

    dom.previewWordTests.appendChild(item);
  });
}

/** ② 예문 빈칸 채우기 미리보기를 렌더링한다 (빈 항목만 있으면 섹션 숨김) */
function renderPreviewFillBlanks() {
  const entries = fillBlanks
    .map((item) => ({ sentence: item.sentence.trim(), hint: item.hint.trim() }))
    .filter((item) => item.sentence);

  dom.fillBlankDivider.hidden = entries.length === 0;
  dom.fillBlankSection.hidden = entries.length === 0;
  dom.previewFillBlanks.innerHTML = "";

  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "test-list__item";

    const num = document.createElement("span");
    num.className = "test-list__num";
    num.textContent = circledNumber(index + 1);
    li.appendChild(num);

    const body = document.createElement("div");
    body.className = "test-list__body";

    const sentence = document.createElement("p");
    sentence.className = "test-list__prompt test-list__prompt--jp";
    sentence.textContent = entry.sentence;
    body.appendChild(sentence);

    if (entry.hint) {
      const hint = document.createElement("p");
      hint.className = "test-list__hint";
      hint.textContent = `힌트: ${entry.hint}`;
      body.appendChild(hint);
    }

    li.appendChild(body);
    dom.previewFillBlanks.appendChild(li);
  });
}

/** ③ 예문 해석하기 미리보기를 렌더링한다 */
function renderPreviewTranslates() {
  const entries = translates.map((item) => item.sentence.trim()).filter(Boolean);

  dom.translateDivider.hidden = entries.length === 0;
  dom.translateSection.hidden = entries.length === 0;
  dom.previewTranslates.innerHTML = "";

  entries.forEach((sentence, index) => {
    const li = document.createElement("li");
    li.className = "test-list__item";

    const num = document.createElement("span");
    num.className = "test-list__num";
    num.textContent = circledNumber(index + 1);
    li.appendChild(num);

    const body = document.createElement("div");
    body.className = "test-list__body";

    const sentenceEl = document.createElement("p");
    sentenceEl.className = "test-list__prompt test-list__prompt--jp";
    sentenceEl.textContent = sentence;
    body.appendChild(sentenceEl);

    body.appendChild(createBlankLine());

    li.appendChild(body);
    dom.previewTranslates.appendChild(li);
  });
}

/** ④ 복습 문장 작문하기 미리보기를 렌더링한다 (작문 공간 2줄 제공) */
function renderPreviewComposes() {
  const entries = composes.map((item) => item.prompt.trim()).filter(Boolean);

  dom.composeDivider.hidden = entries.length === 0;
  dom.composeSection.hidden = entries.length === 0;
  dom.previewComposes.innerHTML = "";

  entries.forEach((prompt, index) => {
    const li = document.createElement("li");
    li.className = "test-list__item";

    const num = document.createElement("span");
    num.className = "test-list__num";
    num.textContent = circledNumber(index + 1);
    li.appendChild(num);

    const body = document.createElement("div");
    body.className = "test-list__body";

    const promptEl = document.createElement("p");
    promptEl.className = "test-list__prompt";
    promptEl.textContent = prompt;
    body.appendChild(promptEl);

    body.appendChild(createBlankLine());
    body.appendChild(createBlankLine());

    li.appendChild(body);
    dom.previewComposes.appendChild(li);
  });
}

/** 미리보기를 실시간 업데이트한다 */
function updatePreview() {
  const month = dom.reviewMonth.value.trim();
  dom.previewTitle.textContent = month ? `${month} 일본어 복습하기` : "이달의 일본어 복습하기";

  renderPreviewWordTests();
  renderPreviewFillBlanks();
  renderPreviewTranslates();
  renderPreviewComposes();
}

/* ==========================================================================
   Export Module
   ========================================================================== */

/** 로딩 오버레이 표시/숨김 */
function showLoading(show) {
  dom.loadingOverlay.hidden = !show;
  dom.loadingOverlay.setAttribute("aria-hidden", String(!show));
}

/** 지정 ms 만큼 대기한다 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 캡처 전 웹폰트가 로드될 때까지 대기한다 */
async function ensureFontsReady() {
  const samples = [
    '500 19px "Noto Sans JP"',
    '700 30px "Noto Sans JP"',
    "500 17px Pretendard",
    "800 26px Pretendard",
  ];

  await Promise.all([
    document.fonts.ready,
    ...samples.map((spec) => document.fonts.load(spec).catch(() => undefined)),
  ]);
}

/**
 * PDF 캡처용 오프스크린 노드를 만든다 (transform 없이 794×1123 그대로 렌더)
 * @returns {{ wrapper: HTMLElement, node: HTMLElement }}
 */
function createExportClone() {
  const source = dom.testSheet;
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;height:1123px;overflow:visible;pointer-events:none;z-index:-1;";

  const node = source.cloneNode(true);
  node.removeAttribute("id");
  node.style.cssText =
    "position:static;transform:none;left:auto;top:auto;width:794px;height:1123px;margin:0;overflow:hidden;";

  wrapper.appendChild(node);
  document.body.appendChild(wrapper);
  return { wrapper, node };
}

/** 다운로드 파일명을 생성한다 */
function generateFilename() {
  const raw = dom.reviewMonth.value.trim() || "test";
  const safe = raw.replace(/\s+/g, "_").replace(/[^\w가-힣ㄱ-ㆎ.-]/g, "");
  return `Study_Japanese_Test_${safe || "test"}.pdf`;
}

/** html2pdf.js로 복습 테스트를 A4 PDF로 저장한다 */
async function exportPdf() {
  if (typeof html2pdf === "undefined") {
    alert("html2pdf 라이브러리를 불러올 수 없습니다. 인터넷 연결을 확인해 주세요.");
    return;
  }

  showLoading(true);
  await delay(300);

  let captureRoot = null;

  try {
    await ensureFontsReady();

    const { wrapper, node } = createExportClone();
    captureRoot = wrapper;

    await new Promise((resolve) => requestAnimationFrame(resolve));

    await html2pdf()
      .set({
        margin: 0,
        filename: generateFilename(),
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(node)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        /* html2pdf.js가 반올림 오차로 만드는 얇은 여분 페이지 제거 */
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = totalPages; i > 1; i -= 1) {
          pdf.deletePage(i);
        }
      })
      .save();
  } catch (err) {
    console.error("PDF export failed:", err);
    alert("PDF 생성에 실패했습니다. 다시 시도해 주세요.");
  } finally {
    captureRoot?.remove();
    showLoading(false);
  }
}

/* ==========================================================================
   Event Handlers
   ========================================================================== */

function bindEvents() {
  dom.reviewMonth.addEventListener("input", updatePreview);

  dom.addWordTestBtn.addEventListener("click", () => {
    wordTests.push({ prompt: "" });
    renderWordTestEntries();
    updatePreview();
  });

  dom.applyWordTestJsonBtn.addEventListener("click", applyWordTestJson);

  dom.addFillBlankBtn.addEventListener("click", () => {
    fillBlanks.push({ sentence: "", hint: "" });
    renderFillBlankEntries();
    updatePreview();
  });

  dom.addTranslateBtn.addEventListener("click", () => {
    translates.push({ sentence: "" });
    renderTranslateEntries();
    updatePreview();
  });

  dom.addComposeBtn.addEventListener("click", () => {
    composes.push({ prompt: "" });
    renderComposeEntries();
    updatePreview();
  });

  dom.savePdfBtn.addEventListener("click", exportPdf);
}

/* ==========================================================================
   Init
   ========================================================================== */

function init() {
  renderAllForms();
  bindEvents();
  updatePreview();
}

init();
