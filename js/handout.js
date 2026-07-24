/**
 * NHK Easy News Handout Generator
 * Vanilla JS — A4 핸드아웃 미리보기 + html2pdf.js PDF 저장
 */

/* ==========================================================================
   DOM References
   ========================================================================== */

const dom = {
  brandText: document.getElementById("brandText"),
  episodeNumber: document.getElementById("episodeNumber"),
  difficultyStars: document.getElementById("difficultyStars"),
  wordEntries: document.getElementById("wordEntries"),
  addWordBtn: document.getElementById("addWordBtn"),
  wordJsonInput: document.getElementById("wordJsonInput"),
  applyWordJsonBtn: document.getElementById("applyWordJsonBtn"),
  grammarEntries: document.getElementById("grammarEntries"),
  addGrammarBtn: document.getElementById("addGrammarBtn"),
  grammarJsonInput: document.getElementById("grammarJsonInput"),
  applyGrammarJsonBtn: document.getElementById("applyGrammarJsonBtn"),
  review1: document.getElementById("review1"),
  review2: document.getElementById("review2"),
  review3: document.getElementById("review3"),
  cultureNote: document.getElementById("cultureNote"),
  qrImage: document.getElementById("qrImage"),

  handout: document.getElementById("handout"),
  previewBrand: document.getElementById("previewBrand"),
  previewEpisode: document.getElementById("previewEpisode"),
  previewDifficulty: document.getElementById("previewDifficulty"),
  previewDifficultyStars: document.getElementById("previewDifficultyStars"),
  previewWords: document.getElementById("previewWords"),
  previewGrammars: document.getElementById("previewGrammars"),
  previewReviewDivider: document.getElementById("previewReviewDivider"),
  previewReviewSection: document.getElementById("previewReviewSection"),
  previewReviewList: document.getElementById("previewReviewList"),
  previewCultureDivider: document.getElementById("previewCultureDivider"),
  previewCultureSection: document.getElementById("previewCultureSection"),
  previewCultureNote: document.getElementById("previewCultureNote"),
  previewQr: document.getElementById("previewQr"),

  savePdfBtn: document.getElementById("savePdfBtn"),
  loadingOverlay: document.getElementById("loadingOverlay"),
};

const CIRCLED_NUMBERS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
const MEMORIZE_CHECK_COUNT = 3;
const MAX_DIFFICULTY = 5;
const CULTURE_NOTE_ALLOWED_TAGS = /&lt;(\/?)(b|strong|br)\s*\/?&gt;/gi;

/* ==========================================================================
   State
   ========================================================================== */

const words = [{ kanji: "", meaning: "", example: "", exampleTranslation: "" }];
const grammars = [{ pattern: "", example: "", exampleTranslation: "" }];
let difficulty = 0;

/* ==========================================================================
   Shared Helpers
   ========================================================================== */

/** n번째 항목의 원문자 번호를 반환한다 (21 이상은 "N."로 대체) */
function circledNumber(n) {
  return n <= CIRCLED_NUMBERS.length ? CIRCLED_NUMBERS[n - 1] : `${n}.`;
}

/** 회차 번호를 "No.001" 형식으로 변환한다 */
function formatEpisodeNumber(value) {
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num) || num < 0) {
    return "";
  }
  return `No.${String(num).padStart(3, "0")}`;
}

/**
 * 일본 문화 알아보기 입력값을 이스케이프한 뒤, 허용된 태그(b, strong, br)만
 * 다시 HTML로 되살린다. 그 외 입력은 항상 순수 텍스트로만 렌더링된다.
 */
function sanitizeCultureNote(text) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(CULTURE_NOTE_ALLOWED_TAGS, (match, closing, tag) => `<${closing}${tag.toLowerCase()}>`);
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
   Form Rendering — 난이도 별점
   ========================================================================== */

/** 난이도 별점 선택 버튼 5개를 렌더링한다 (같은 별을 다시 누르면 초기화) */
function renderDifficultyStars() {
  dom.difficultyStars.innerHTML = "";

  for (let i = 1; i <= MAX_DIFFICULTY; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "star-btn";
    btn.textContent = i <= difficulty ? "★" : "☆";
    btn.setAttribute("aria-label", `난이도 ${i}`);
    btn.addEventListener("click", () => {
      difficulty = difficulty === i ? 0 : i;
      renderDifficultyStars();
      updatePreview();
    });
    dom.difficultyStars.appendChild(btn);
  }
}

/* ==========================================================================
   Form Rendering — 핵심 단어 / 문법
   ========================================================================== */

/** JSON 항목 하나를 단어 데이터 형태로 정규화한다 (키 이름은 관대하게 허용) */
function normalizeWordItem(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const kanji = String(raw.kanji ?? raw.word ?? raw.단어 ?? "").trim();
  const meaning = String(raw.meaning ?? raw.뜻 ?? "").trim();
  const example = String(raw.example ?? raw.예문 ?? "").trim();
  const exampleTranslation = String(
    raw.exampleTranslation ?? raw.translation ?? raw.해석 ?? raw["예문 해석"] ?? ""
  ).trim();

  if (!kanji && !meaning && !example) {
    return null;
  }

  return { kanji, meaning, example, exampleTranslation };
}

/** JSON 붙여넣기 입력을 파싱해 단어 목록 전체를 교체한다 */
function applyWordJson() {
  let parsed;
  try {
    parsed = JSON.parse(dom.wordJsonInput.value);
  } catch (err) {
    alert("JSON 형식이 올바르지 않습니다. 문법을 확인해 주세요.");
    return;
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  const normalized = list.map(normalizeWordItem).filter(Boolean);

  if (normalized.length === 0) {
    alert("가져올 수 있는 단어 항목이 없습니다.");
    return;
  }

  words.length = 0;
  words.push(...normalized);
  renderWordEntries();
  updatePreview();
}

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

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문 해석",
        value: word.exampleTranslation,
        placeholder: "예: 벚꽃 개화는 언제입니까?",
        onInput: (value) => {
          word.exampleTranslation = value;
          updatePreview();
        },
      })
    );

    dom.wordEntries.appendChild(entry);
  });
}

/** JSON 항목 하나를 문법 데이터 형태로 정규화한다 (키 이름은 관대하게 허용) */
function normalizeGrammarItem(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const pattern = String(raw.pattern ?? raw.문법 ?? raw["문법 패턴"] ?? "").trim();
  const example = String(raw.example ?? raw.예문 ?? "").trim();
  const exampleTranslation = String(
    raw.exampleTranslation ?? raw.translation ?? raw.해석 ?? raw["예문 해석"] ?? ""
  ).trim();

  if (!pattern && !example) {
    return null;
  }

  return { pattern, example, exampleTranslation };
}

/** JSON 붙여넣기 입력을 파싱해 문법 목록 전체를 교체한다 */
function applyGrammarJson() {
  let parsed;
  try {
    parsed = JSON.parse(dom.grammarJsonInput.value);
  } catch (err) {
    alert("JSON 형식이 올바르지 않습니다. 문법을 확인해 주세요.");
    return;
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  const normalized = list.map(normalizeGrammarItem).filter(Boolean);

  if (normalized.length === 0) {
    alert("가져올 수 있는 문법 항목이 없습니다.");
    return;
  }

  grammars.length = 0;
  grammars.push(...normalized);
  renderGrammarEntries();
  updatePreview();
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
        maxlength: 60,
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

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문 해석",
        value: grammar.exampleTranslation,
        placeholder: "예: 혼자서 할 수 있게 되었습니다.",
        onInput: (value) => {
          grammar.exampleTranslation = value;
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

/** 암기 확인용 체크 박스 3칸을 생성한다 */
function createCheckRow() {
  const row = document.createElement("div");
  row.className = "a4-check-row";

  for (let i = 0; i < MEMORIZE_CHECK_COUNT; i += 1) {
    const box = document.createElement("span");
    box.className = "a4-check-box";
    row.appendChild(box);
  }

  return row;
}

/** 예문 + 해석을 한 줄로 합쳐 렌더링한다 (단어/문법 공용) */
function createExampleLine(example, translation) {
  if (!example && !translation) {
    return null;
  }

  const p = document.createElement("p");
  p.className = "a4-example-line";

  if (example) {
    const jp = document.createElement("span");
    jp.className = "a4-example-line--jp";
    jp.textContent = example;
    p.appendChild(jp);
  }

  if (translation) {
    const tr = document.createElement("span");
    tr.className = "a4-example-line__tr";
    tr.textContent = ` — ${translation}`;
    p.appendChild(tr);
  }

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

    const text = document.createElement("div");
    text.className = "a4-word__text";

    const kanji = document.createElement("span");
    kanji.className = "a4-word__kanji";
    kanji.textContent = word.kanji.trim() || (index === 0 ? "開花" : "");
    text.appendChild(kanji);

    const meaning = document.createElement("span");
    meaning.className = "a4-word__meaning";
    meaning.textContent = word.meaning.trim();
    text.appendChild(meaning);

    wordRow.appendChild(text);

    wordRow.appendChild(createCheckRow());

    block.appendChild(wordRow);

    const exampleLine = createExampleLine(word.example.trim(), word.exampleTranslation.trim());
    if (exampleLine) {
      block.appendChild(exampleLine);
    }

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

    const exampleLine = createExampleLine(grammar.example.trim(), grammar.exampleTranslation.trim());
    if (exampleLine) {
      block.appendChild(exampleLine);
    }

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

/** 난이도 별점 미리보기를 렌더링한다 (설정하지 않으면 숨김) */
function renderPreviewDifficulty() {
  dom.previewDifficulty.hidden = difficulty === 0;
  dom.previewDifficultyStars.textContent =
    "★".repeat(difficulty) + "☆".repeat(MAX_DIFFICULTY - difficulty);
}

/** 미리보기를 실시간 업데이트한다 */
function updatePreview() {
  dom.previewBrand.textContent = dom.brandText.value.trim() || "NHK EASY NEWS";
  dom.previewEpisode.textContent = formatEpisodeNumber(dom.episodeNumber.value);

  renderPreviewDifficulty();
  renderPreviewWords();
  renderPreviewGrammars();
  renderPreviewReviews();
  renderPreviewCulture();
}

/** 일본 문화 알아보기 내용이 없으면 구분선과 섹션을 함께 숨긴다 */
function renderPreviewCulture() {
  const note = dom.cultureNote.value.trim();

  dom.previewCultureDivider.hidden = !note;
  dom.previewCultureSection.hidden = !note;
  dom.previewCultureNote.innerHTML = sanitizeCultureNote(note);
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
  const raw = formatEpisodeNumber(dom.episodeNumber.value) || words[0]?.kanji.trim() || "handout";
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

/** QR 코드 이미지 업로드를 처리한다 */
function handleQrUpload(file) {
  if (!file) {
    dom.previewQr.hidden = true;
    dom.previewQr.removeAttribute("src");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    dom.previewQr.src = reader.result;
    dom.previewQr.hidden = false;
  };
  reader.readAsDataURL(file);
}

function bindEvents() {
  [dom.brandText, dom.episodeNumber, dom.review1, dom.review2, dom.review3, dom.cultureNote].forEach(
    (input) => {
      input.addEventListener("input", updatePreview);
    }
  );

  dom.addWordBtn.addEventListener("click", () => {
    words.push({ kanji: "", meaning: "", example: "", exampleTranslation: "" });
    renderWordEntries();
    updatePreview();
  });

  dom.applyWordJsonBtn.addEventListener("click", applyWordJson);

  dom.addGrammarBtn.addEventListener("click", () => {
    grammars.push({ pattern: "", example: "", exampleTranslation: "" });
    renderGrammarEntries();
    updatePreview();
  });

  dom.applyGrammarJsonBtn.addEventListener("click", applyGrammarJson);

  dom.qrImage.addEventListener("change", () => {
    handleQrUpload(dom.qrImage.files[0]);
  });

  dom.savePdfBtn.addEventListener("click", exportPdf);
}

/* ==========================================================================
   Init
   ========================================================================== */

function init() {
  renderDifficultyStars();
  renderWordEntries();
  renderGrammarEntries();
  bindEvents();
  updatePreview();
}

init();
