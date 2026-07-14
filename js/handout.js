/**
 * NHK Easy News Handout Generator
 * Vanilla JS — A4 핸드아웃 미리보기 + html2pdf.js PDF 저장
 */

/* ==========================================================================
   DOM References
   ========================================================================== */

const dom = {
  brandText: document.getElementById("brandText"),
  dateText: document.getElementById("dateText"),
  wordEntries: document.getElementById("wordEntries"),
  addWordBtn: document.getElementById("addWordBtn"),
  grammarEntries: document.getElementById("grammarEntries"),
  addGrammarBtn: document.getElementById("addGrammarBtn"),
  review1: document.getElementById("review1"),
  review2: document.getElementById("review2"),
  review3: document.getElementById("review3"),
  cultureNote: document.getElementById("cultureNote"),

  handout: document.getElementById("handout"),
  previewBrand: document.getElementById("previewBrand"),
  previewDate: document.getElementById("previewDate"),
  previewWords: document.getElementById("previewWords"),
  previewGrammars: document.getElementById("previewGrammars"),
  previewReviewDivider: document.getElementById("previewReviewDivider"),
  previewReviewSection: document.getElementById("previewReviewSection"),
  previewReviewList: document.getElementById("previewReviewList"),
  previewCultureNote: document.getElementById("previewCultureNote"),

  savePdfBtn: document.getElementById("savePdfBtn"),
  loadingOverlay: document.getElementById("loadingOverlay"),
};

const MIN_BLANK_BOXES = 6;
const MAX_BLANK_BOXES = 20;
const DEFAULT_BLANK_BOXES = 10;
const CIRCLED_NUMBERS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

/* ==========================================================================
   State
   ========================================================================== */

const words = [{ kanji: "", meaning: "", example: "" }];
const grammars = [{ pattern: "", example: "" }];

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

/* ==========================================================================
   Form Rendering — 핵심 단어 / 문법
   ========================================================================== */

/** 단어 입력 카드 목록을 렌더링한다 */
function renderWordEntries() {
  dom.wordEntries.innerHTML = "";

  words.forEach((word, index) => {
    const entry = document.createElement("div");
    entry.className = "repeat-entry";

    entry.appendChild(
      createEntryHeader({
        labelText: `단어 ${index + 1}`,
        canRemove: words.length > 1,
        onRemove: () => {
          words.splice(index, 1);
          renderWordEntries();
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "단어",
        value: word.kanji,
        placeholder: "例: 開花",
        maxlength: 20,
        extraClass: "form__input--jp",
        onInput: (value) => {
          word.kanji = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "뜻",
        value: word.meaning,
        placeholder: "예: 개화, 꽃이 핌",
        maxlength: 60,
        onInput: (value) => {
          word.meaning = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문",
        value: word.example,
        placeholder: "例: 桜の開花はいつですか。",
        extraClass: "form__textarea--jp",
        onInput: (value) => {
          word.example = value;
          updatePreview();
        },
      })
    );

    dom.wordEntries.appendChild(entry);
  });
}

/** 문법 입력 카드 목록을 렌더링한다 */
function renderGrammarEntries() {
  dom.grammarEntries.innerHTML = "";

  grammars.forEach((grammar, index) => {
    const entry = document.createElement("div");
    entry.className = "repeat-entry";

    entry.appendChild(
      createEntryHeader({
        labelText: `문법 ${index + 1}`,
        canRemove: grammars.length > 1,
        onRemove: () => {
          grammars.splice(index, 1);
          renderGrammarEntries();
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "문법 패턴",
        value: grammar.pattern,
        placeholder: "例: ～ようになる",
        maxlength: 30,
        extraClass: "form__input--jp",
        onInput: (value) => {
          grammar.pattern = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문",
        value: grammar.example,
        placeholder: "例: 一人で出来るようになりました。",
        extraClass: "form__textarea--jp",
        onInput: (value) => {
          grammar.example = value;
          updatePreview();
        },
      })
    );

    dom.grammarEntries.appendChild(entry);
  });
}

/* ==========================================================================
   Preview Module
   ========================================================================== */

/** 예문 텍스트에서 빈칸 연습용 글자 수를 센다 (공백 제외) */
function countPracticeChars(text) {
  return text.replace(/[\s　]/g, "").length;
}

/** 빈칸 연습 박스(원고지 스타일)를 렌더링한다 */
function renderBlankBoxes(container, text) {
  const charCount = countPracticeChars(text);
  const count = charCount
    ? Math.min(MAX_BLANK_BOXES, Math.max(MIN_BLANK_BOXES, charCount))
    : DEFAULT_BLANK_BOXES;

  container.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const box = document.createElement("span");
    box.className = "a4-box";
    container.appendChild(box);
  }
}

/** 라벨 + 값 한 줄(a4-field)을 생성한다 */
function createPreviewField(labelText, value, isJp) {
  const p = document.createElement("p");
  p.className = "a4-field";

  const label = document.createElement("span");
  label.className = "a4-field__label";
  label.textContent = labelText;
  p.appendChild(label);

  const val = document.createElement("span");
  val.className = `a4-field__value ${isJp ? "a4-field__value--jp" : ""}`.trim();
  val.textContent = value;
  p.appendChild(val);

  return p;
}

/** 핵심 단어 미리보기를 렌더링한다 */
function renderPreviewWords() {
  dom.previewWords.innerHTML = "";

  words.forEach((word, index) => {
    const block = document.createElement("div");
    block.className = "a4-word-block";

    const wordRow = document.createElement("div");
    wordRow.className = "a4-word";

    const num = document.createElement("span");
    num.className = "a4-word__num";
    num.textContent = circledNumber(index + 1);
    wordRow.appendChild(num);

    const kanji = document.createElement("span");
    kanji.className = "a4-word__kanji";
    kanji.textContent = word.kanji.trim() || (index === 0 ? "開花" : "");
    wordRow.appendChild(kanji);

    block.appendChild(wordRow);
    block.appendChild(createPreviewField("뜻", word.meaning.trim()));
    block.appendChild(createPreviewField("예문", word.example.trim(), true));

    const blank = document.createElement("div");
    blank.className = "a4-blank-line";
    renderBlankBoxes(blank, word.example);
    block.appendChild(blank);

    dom.previewWords.appendChild(block);
  });
}

/** 문법 미리보기를 렌더링한다 */
function renderPreviewGrammars() {
  dom.previewGrammars.innerHTML = "";

  grammars.forEach((grammar, index) => {
    const block = document.createElement("div");
    block.className = "a4-grammar-block";

    const patternRow = document.createElement("div");
    patternRow.className = "a4-word";

    const num = document.createElement("span");
    num.className = "a4-word__num";
    num.textContent = circledNumber(index + 1);
    patternRow.appendChild(num);

    const pattern = document.createElement("span");
    pattern.className = "a4-grammar-pattern a4-grammar-pattern--jp";
    pattern.textContent = grammar.pattern.trim();
    patternRow.appendChild(pattern);

    block.appendChild(patternRow);
    block.appendChild(createPreviewField("예문", grammar.example.trim(), true));

    const blank = document.createElement("div");
    blank.className = "a4-blank-line";
    renderBlankBoxes(blank, grammar.example);
    block.appendChild(blank);

    dom.previewGrammars.appendChild(block);
  });
}

/** 입력된 복습 항목만 미리보기 목록에 렌더링한다 (빈 항목은 숨김) */
function renderPreviewReviews() {
  const reviews = [dom.review1.value, dom.review2.value, dom.review3.value]
    .map((value) => value.trim())
    .filter(Boolean);

  dom.previewReviewDivider.hidden = reviews.length === 0;
  dom.previewReviewSection.hidden = reviews.length === 0;

  dom.previewReviewList.innerHTML = "";
  reviews.forEach((text) => {
    const li = document.createElement("li");
    li.className = "a4-review__item";

    const span = document.createElement("span");
    span.className = "a4-review__text";
    span.textContent = text;

    li.appendChild(span);
    dom.previewReviewList.appendChild(li);
  });
}

/** 미리보기를 실시간 업데이트한다 */
function updatePreview() {
  dom.previewBrand.textContent = dom.brandText.value.trim() || "NHK EASY NEWS";
  dom.previewDate.textContent = dom.dateText.value.trim();

  renderPreviewWords();
  renderPreviewGrammars();
  renderPreviewReviews();

  dom.previewCultureNote.textContent = dom.cultureNote.value.trim();
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
  const source = dom.handout;
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
  const raw = dom.dateText.value.trim() || words[0]?.kanji.trim() || "handout";
  const safe = raw.replace(/\s+/g, "_").replace(/[^\w가-힣ㄱ-ㆎ.-]/g, "");
  return `Study_Japanese_${safe || "handout"}.pdf`;
}

/** html2pdf.js로 핸드아웃을 A4 PDF로 저장한다 */
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
  [dom.brandText, dom.dateText, dom.review1, dom.review2, dom.review3, dom.cultureNote].forEach(
    (input) => {
      input.addEventListener("input", updatePreview);
    }
  );

  dom.addWordBtn.addEventListener("click", () => {
    words.push({ kanji: "", meaning: "", example: "" });
    renderWordEntries();
    updatePreview();
  });

  dom.addGrammarBtn.addEventListener("click", () => {
    grammars.push({ pattern: "", example: "" });
    renderGrammarEntries();
    updatePreview();
  });

  dom.savePdfBtn.addEventListener("click", exportPdf);
}

/* ==========================================================================
   Init
   ========================================================================== */

function init() {
  renderWordEntries();
  renderGrammarEntries();
  bindEvents();
  updatePreview();
}

init();
