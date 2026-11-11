const dom = {
  brandText: document.getElementById("brandText"),
  episodeNumber: document.getElementById("episodeNumber"),
  difficultyStars: document.getElementById("difficultyStars"),

  songTitle: document.getElementById("songTitle"),
  songArtist: document.getElementById("songArtist"),
  songTheme: document.getElementById("songTheme"),

  expressionEntries: document.getElementById("expressionEntries"),
  addExpressionBtn: document.getElementById("addExpressionBtn"),
  expressionJsonInput: document.getElementById("expressionJsonInput"),
  applyExpressionJsonBtn: document.getElementById("applyExpressionJsonBtn"),
  vocabEntries: document.getElementById("vocabEntries"),
  addVocabBtn: document.getElementById("addVocabBtn"),
  vocabJsonInput: document.getElementById("vocabJsonInput"),
  applyVocabJsonBtn: document.getElementById("applyVocabJsonBtn"),
  grammarEntries: document.getElementById("grammarEntries"),
  addGrammarBtn: document.getElementById("addGrammarBtn"),
  grammarJsonInput: document.getElementById("grammarJsonInput"),
  applyGrammarJsonBtn: document.getElementById("applyGrammarJsonBtn"),

  metaphorNote: document.getElementById("metaphorNote"),
  conversationNote: document.getElementById("conversationNote"),
  readingNote: document.getElementById("readingNote"),
  quizNote: document.getElementById("quizNote"),
  summaryWords: document.getElementById("summaryWords"),
  summaryGrammar: document.getElementById("summaryGrammar"),
  summarySentence: document.getElementById("summarySentence"),

  qrImage: document.getElementById("qrImage"),
  savePdfBtn: document.getElementById("savePdfBtn"),
  loadingOverlay: document.getElementById("loadingOverlay"),

  previewBrand: document.getElementById("previewBrand"),
  previewBrandSecond: document.getElementById("previewBrandSecond"),
  previewEpisode: document.getElementById("previewEpisode"),
  previewEpisodeSecond: document.getElementById("previewEpisodeSecond"),
  previewDifficulty: document.getElementById("previewDifficulty"),
  previewDifficultyStars: document.getElementById("previewDifficultyStars"),
  previewSongTitle: document.getElementById("previewSongTitle"),
  previewSongArtist: document.getElementById("previewSongArtist"),
  previewSongTheme: document.getElementById("previewSongTheme"),
  previewExpressions: document.getElementById("previewExpressions"),
  previewVocab: document.getElementById("previewVocab"),
  previewGrammar: document.getElementById("previewGrammar"),
  previewMetaphor: document.getElementById("previewMetaphor"),
  previewConversation: document.getElementById("previewConversation"),
  previewReading: document.getElementById("previewReading"),
  previewQuiz: document.getElementById("previewQuiz"),
  previewSummaryWords: document.getElementById("previewSummaryWords"),
  previewSummaryGrammar: document.getElementById("previewSummaryGrammar"),
  previewSummarySentence: document.getElementById("previewSummarySentence"),
  previewQr: document.getElementById("previewQr"),
};

const CIRCLED_NUMBERS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
const MAX_DIFFICULTY = 5;
const ALLOWED_RICH_TAGS = /&lt;(\/?)((b|strong|br))\s*\/?>/gi;

const expressions = [{ phrase: "", furigana: "", meaning: "", nuance: "", example: "", exampleTranslation: "" }];
const vocab = [{ word: "", reading: "", meaning: "", part: "", usage: "", example: "", exampleTranslation: "" }];
const grammar = [{ pattern: "", explanation: "", usage: "", example: "", exampleTranslation: "" }];
let difficulty = 0;

function circledNumber(n) {
  return n <= CIRCLED_NUMBERS.length ? CIRCLED_NUMBERS[n - 1] : `${n}.`;
}

function formatEpisodeNumber(value) {
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num) || num < 0) {
    return "";
  }
  return `No.${String(num).padStart(3, "0")}`;
}

function sanitizeRichText(text) {
  if (!text) return "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(ALLOWED_RICH_TAGS, (match, closing, tag) => `<${closing}${tag.toLowerCase()}>`);
}

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

function createTextareaGroup({ labelText, value, placeholder, extraClass, rows, onInput }) {
  const group = document.createElement("div");
  group.className = "form__group";

  const label = document.createElement("label");
  label.className = "form__label";
  label.textContent = labelText;
  group.appendChild(label);

  const textarea = document.createElement("textarea");
  textarea.className = `form__input form__textarea ${extraClass || ""}`.trim();
  textarea.rows = rows || 2;
  textarea.value = value;
  textarea.placeholder = placeholder;
  textarea.addEventListener("input", () => onInput(textarea.value));
  group.appendChild(textarea);

  return group;
}

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

function renderExpressionEntries() {
  dom.expressionEntries.innerHTML = "";

  expressions.forEach((item, index) => {
    const entry = document.createElement("div");
    entry.className = "repeat-entry";

    entry.appendChild(
      createEntryHeader({
        labelText: `표현 ${index + 1}`,
        canRemove: expressions.length > 1,
        onRemove: () => {
          expressions.splice(index, 1);
          renderExpressionEntries();
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "원문 표현",
        value: item.phrase,
        placeholder: "예: 何も言えない",
        maxlength: 60,
        extraClass: "form__input--jp",
        onInput: (value) => {
          item.phrase = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "후리가나",
        value: item.furigana,
        placeholder: "예: なにもいえない",
        maxlength: 60,
        extraClass: "form__input--jp",
        onInput: (value) => {
          item.furigana = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "자연스러운 의미",
        value: item.meaning,
        placeholder: "예: 아무 말도 할 수 없다",
        maxlength: 80,
        onInput: (value) => {
          item.meaning = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "문맥에서의 뉘앙스",
        value: item.nuance,
        placeholder: "예: 감정이 너무 커서 말을 삼키는 듯한 뉘앙스",
        rows: 2,
        onInput: (value) => {
          item.nuance = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문",
        value: item.example,
        placeholder: "예: 新しい出会いがありました。",
        rows: 2,
        extraClass: "form__textarea--jp",
        onInput: (value) => {
          item.example = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문 번역",
        value: item.exampleTranslation,
        placeholder: "예문의 한국어 번역",
        rows: 2,
        onInput: (value) => {
          item.exampleTranslation = value;
          updatePreview();
        },
      })
    );

    dom.expressionEntries.appendChild(entry);
  });
}

function renderVocabEntries() {
  dom.vocabEntries.innerHTML = "";

  vocab.forEach((item, index) => {
    const entry = document.createElement("div");
    entry.className = "repeat-entry";

    entry.appendChild(
      createEntryHeader({
        labelText: `단어 ${index + 1}`,
        canRemove: vocab.length > 1,
        onRemove: () => {
          vocab.splice(index, 1);
          renderVocabEntries();
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "단어",
        value: item.word,
        placeholder: "예: 寂しい",
        maxlength: 30,
        extraClass: "form__input--jp",
        onInput: (value) => {
          item.word = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "읽는 법",
        value: item.reading,
        placeholder: "예: さびしい",
        maxlength: 40,
        extraClass: "form__input--jp",
        onInput: (value) => {
          item.reading = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "뜻",
        value: item.meaning,
        placeholder: "예: 외로움, 쓸쓸함",
        maxlength: 60,
        onInput: (value) => {
          item.meaning = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "품사",
        value: item.part,
        placeholder: "예: 형용사",
        maxlength: 30,
        onInput: (value) => {
          item.part = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "가사 속 의미와 일상 속 활용",
        value: item.usage,
        placeholder: "예: 노래에서는 이별의 공허함을 뜻하고, 일상에서는 조용한 분위기를 설명할 때도 씀",
        rows: 2,
        onInput: (value) => {
          item.usage = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문",
        value: item.example,
        placeholder: "예: 素敵な人に巡り合いました。",
        rows: 2,
        extraClass: "form__textarea--jp",
        onInput: (value) => {
          item.example = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문 번역",
        value: item.exampleTranslation,
        placeholder: "예문의 한국어 번역",
        rows: 2,
        onInput: (value) => {
          item.exampleTranslation = value;
          updatePreview();
        },
      })
    );

    dom.vocabEntries.appendChild(entry);
  });
}

function renderGrammarEntries() {
  dom.grammarEntries.innerHTML = "";

  grammar.forEach((item, index) => {
    const entry = document.createElement("div");
    entry.className = "repeat-entry";

    entry.appendChild(
      createEntryHeader({
        labelText: `문법 ${index + 1}`,
        canRemove: grammar.length > 1,
        onRemove: () => {
          grammar.splice(index, 1);
          renderGrammarEntries();
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "문법 / 문형",
        value: item.pattern,
        placeholder: "예: ～ように",
        maxlength: 50,
        extraClass: "form__input--jp",
        onInput: (value) => {
          item.pattern = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createFieldGroup({
        labelText: "설명",
        value: item.explanation,
        placeholder: "예: 바라는 마음이나 의도를 나타내는 표현",
        maxlength: 80,
        onInput: (value) => {
          item.explanation = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "가사 속 사용 방식",
        value: item.usage,
        placeholder: "예: 감정을 표현할 때 ‘~になりたい’처럼 쓰이지만, 노래에서는 더 서정적으로 들림",
        rows: 2,
        onInput: (value) => {
          item.usage = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문",
        value: item.example,
        placeholder: "예: 伝えたい気持ちが、言葉にならなかった。",
        rows: 2,
        extraClass: "form__textarea--jp",
        onInput: (value) => {
          item.example = value;
          updatePreview();
        },
      })
    );

    entry.appendChild(
      createTextareaGroup({
        labelText: "예문 번역",
        value: item.exampleTranslation,
        placeholder: "예문의 한국어 번역",
        rows: 2,
        onInput: (value) => {
          item.exampleTranslation = value;
          updatePreview();
        },
      })
    );

    dom.grammarEntries.appendChild(entry);
  });
}

function renderPreviewDifficulty() {
  dom.previewDifficulty.hidden = difficulty === 0;
  dom.previewDifficultyStars.textContent = "★".repeat(difficulty) + "☆".repeat(MAX_DIFFICULTY - difficulty);
}

function createPreviewDetail(label, value) {
  const detail = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label} `;
  detail.append(strong, document.createTextNode(value));
  return detail;
}

function renderPreviewExpressions() {
  dom.previewExpressions.innerHTML = "";

  expressions.filter((item) => item.phrase || item.meaning || item.nuance || item.example || item.exampleTranslation).forEach((item, index) => {
    const block = document.createElement("div");
    block.className = "song-card";

    const title = document.createElement("div");
    title.className = "song-card__title";

    const num = document.createElement("span");
    num.className = "song-card__num";
    num.textContent = circledNumber(index + 1);
    title.appendChild(num);

    const phrase = document.createElement("span");
    phrase.className = "song-card__phrase";
    phrase.textContent = item.phrase || "핵심 표현";
    title.appendChild(phrase);

    if (item.furigana) {
      const furigana = document.createElement("span");
      furigana.className = "song-card__furigana";
      furigana.textContent = `(${item.furigana})`;
      title.appendChild(furigana);
    }

    const body = document.createElement("div");
    body.className = "song-card__body";

    if (item.meaning) {
      body.appendChild(createPreviewDetail("의미", item.meaning));
    }

    if (item.nuance) {
      body.appendChild(createPreviewDetail("뉘앙스", item.nuance));
    }

    if (item.example) {
      body.appendChild(createPreviewDetail("예문", item.example));
    }

    if (item.exampleTranslation) {
      body.appendChild(createPreviewDetail("번역", item.exampleTranslation));
    }

    block.appendChild(title);
    block.appendChild(body);
    dom.previewExpressions.appendChild(block);
  });
}

function renderPreviewVocab() {
  dom.previewVocab.innerHTML = "";

  vocab.filter((item) => item.word || item.meaning || item.usage || item.example || item.exampleTranslation).forEach((item, index) => {
    const block = document.createElement("div");
    block.className = "song-card";

    const title = document.createElement("div");
    title.className = "song-card__title";

    const num = document.createElement("span");
    num.className = "song-card__num";
    num.textContent = circledNumber(index + 1);
    title.appendChild(num);

    const word = document.createElement("span");
    word.className = "song-card__phrase";
    word.textContent = item.word || "단어";
    title.appendChild(word);

    if (item.reading) {
      const reading = document.createElement("span");
      reading.className = "song-card__furigana";
      reading.textContent = `(${item.reading})`;
      title.appendChild(reading);
    }

    const body = document.createElement("div");
    body.className = "song-card__body";

    if (item.meaning) {
      body.appendChild(createPreviewDetail("뜻", item.meaning));
    }

    if (item.part) {
      body.appendChild(createPreviewDetail("품사", item.part));
    }

    if (item.usage) {
      body.appendChild(createPreviewDetail("활용", item.usage));
    }

    if (item.example) {
      body.appendChild(createPreviewDetail("예문", item.example));
    }

    if (item.exampleTranslation) {
      body.appendChild(createPreviewDetail("번역", item.exampleTranslation));
    }

    block.appendChild(title);
    block.appendChild(body);
    dom.previewVocab.appendChild(block);
  });
}

function renderPreviewGrammar() {
  dom.previewGrammar.innerHTML = "";

  grammar.filter((item) => item.pattern || item.explanation || item.example || item.exampleTranslation).forEach((item, index) => {
    const block = document.createElement("div");
    block.className = "song-card";

    const title = document.createElement("div");
    title.className = "song-card__title";

    const num = document.createElement("span");
    num.className = "song-card__num";
    num.textContent = circledNumber(index + 1);
    title.appendChild(num);

    const pattern = document.createElement("span");
    pattern.className = "song-card__phrase";
    pattern.textContent = item.pattern || "문법";
    title.appendChild(pattern);

    const body = document.createElement("div");
    body.className = "song-card__body";

    if (item.explanation) {
      body.appendChild(createPreviewDetail("설명", item.explanation));
    }

    if (item.usage) {
      body.appendChild(createPreviewDetail("사용 방식", item.usage));
    }

    if (item.example) {
      body.appendChild(createPreviewDetail("예문", item.example));
    }

    if (item.exampleTranslation) {
      body.appendChild(createPreviewDetail("번역", item.exampleTranslation));
    }

    block.appendChild(title);
    block.appendChild(body);
    dom.previewGrammar.appendChild(block);
  });
}

function renderRichText(target, text) {
  const hasContent = Boolean(text.trim());
  const cleaned = sanitizeRichText(hasContent ? text : "");
  target.innerHTML = cleaned.replace(/\n/g, "<br>");

  const section = target.closest(".song-section");
  if (section) {
    section.hidden = !hasContent;
    const divider = section.previousElementSibling;
    if (divider?.classList.contains("a4-divider")) {
      divider.hidden = !hasContent;
    }
  }
}

function applyJsonInput(input, items, normalize, render, label) {
  try {
    const parsed = JSON.parse(input.value);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    const importedItems = list.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(`${index + 1}번째 항목은 객체여야 합니다.`);
      }
      return normalize(item);
    }).filter(Boolean);

    if (importedItems.length === 0) {
      throw new Error(`가져올 수 있는 ${label} 항목이 없습니다.`);
    }

    items.splice(0, items.length, ...importedItems);
    render();
    updatePreview();
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    alert(`JSON을 적용하지 못했습니다: ${message}`);
  }
}

function getJsonString(item, key) {
  return typeof item[key] === "string" ? item[key].trim() : "";
}

function normalizeExpression(item) {
  const phrase = getJsonString(item, "expression");
  const meaning = getJsonString(item, "meaning");
  const example = getJsonString(item, "example");
  const exampleTranslation = getJsonString(item, "exampleTranslation");
  if (!phrase && !meaning && !example) return null;

  return { phrase, furigana: "", meaning, nuance: "", example, exampleTranslation };
}

function normalizeVocab(item) {
  const { word, reading } = splitWordAndReading(getJsonString(item, "kanji"));
  const meaning = getJsonString(item, "meaning");
  const example = getJsonString(item, "example");
  const exampleTranslation = getJsonString(item, "exampleTranslation");
  if (!word && !meaning && !example) return null;

  return { word, reading, meaning, part: "", usage: "", example, exampleTranslation };
}

function normalizeGrammar(item) {
  const pattern = getJsonString(item, "pattern");
  const example = getJsonString(item, "example");
  const exampleTranslation = getJsonString(item, "exampleTranslation");
  if (!pattern && !example) return null;

  return { pattern, explanation: "", usage: "", example, exampleTranslation };
}

function splitWordAndReading(value) {
  const match = value.match(/^(.*?)\s*[（(]([^）)]*)[）)]\s*$/u);
  return match
    ? { word: match[1].trim(), reading: match[2].trim() }
    : { word: value, reading: "" };
}

function updatePreview() {
  const brandText = dom.brandText.value.trim() || "노래가사로 배우는 일본어";
  const episodeText = formatEpisodeNumber(dom.episodeNumber.value);

  dom.previewBrand.textContent = brandText;
  dom.previewBrandSecond.textContent = brandText;
  dom.previewEpisode.textContent = episodeText;
  dom.previewEpisodeSecond.textContent = episodeText;

  renderPreviewDifficulty();

  dom.previewSongTitle.textContent = dom.songTitle.value.trim() || "곡명";
  dom.previewSongArtist.textContent = dom.songArtist.value.trim() || "가수";
  const songTheme = dom.songTheme.value.trim();
  dom.previewSongTheme.textContent = songTheme;
  dom.previewSongTheme.closest(".song-note-box").hidden = !songTheme;

  renderPreviewExpressions();
  renderPreviewVocab();
  renderPreviewGrammar();
  renderRichText(dom.previewMetaphor, dom.metaphorNote.value);
  renderRichText(dom.previewConversation, dom.conversationNote.value);
  renderRichText(dom.previewReading, dom.readingNote.value);
  renderRichText(dom.previewQuiz, dom.quizNote.value);

  dom.previewSummaryWords.textContent = dom.summaryWords.value.trim() || "입력된 단어가 없습니다.";
  dom.previewSummaryGrammar.textContent = dom.summaryGrammar.value.trim() || "입력된 문형이 없습니다.";
  dom.previewSummarySentence.textContent = dom.summarySentence.value.trim() || "오늘의 한 문장을 입력해 주세요.";
}

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

function showLoading(show) {
  dom.loadingOverlay.hidden = !show;
  dom.loadingOverlay.setAttribute("aria-hidden", String(!show));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureFontsReady() {
  const samples = [
    '500 19px "LINE Seed JP"',
    '700 30px "LINE Seed JP"',
    "500 17px Pretendard",
    "800 26px Pretendard",
  ];

  await Promise.all([
    document.fonts.ready,
    ...samples.map((spec) => document.fonts.load(spec).catch(() => undefined)),
  ]);
}

function createExportClone() {
  const source = document.getElementById("songPreviewRoot");
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;overflow:visible;pointer-events:none;z-index:-1;";

  const clone = source.cloneNode(true);
  clone.style.cssText = "display:flex;flex-direction:column;gap:24px;position:static;transform:none;width:794px;margin:0;overflow:visible;";

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  return { wrapper, clone };
}

function generateFilename() {
  const raw = formatEpisodeNumber(dom.episodeNumber.value) || dom.songTitle.value.trim() || "lyrics_handout";
  const safe = raw.replace(/\s+/g, "_").replace(/[^\w가-힣ㄱ-ㆎ.-]/g, "");
  return `Lyrics_Japanese_${safe || "lyrics_handout"}.pdf`;
}

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
    const { wrapper, clone } = createExportClone();
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
      .from(clone)
      .save();
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("PDF 생성에 실패했습니다. 다시 시도해 주세요.");
  } finally {
    captureRoot?.remove();
    showLoading(false);
  }
}

function bindEvents() {
  [
    dom.brandText,
    dom.episodeNumber,
    dom.songTitle,
    dom.songArtist,
    dom.songTheme,
    dom.metaphorNote,
    dom.conversationNote,
    dom.readingNote,
    dom.quizNote,
    dom.summaryWords,
    dom.summaryGrammar,
    dom.summarySentence,
  ].forEach((input) => {
    input.addEventListener("input", updatePreview);
  });

  dom.addExpressionBtn.addEventListener("click", () => {
    expressions.push({ phrase: "", furigana: "", meaning: "", nuance: "", example: "", exampleTranslation: "" });
    renderExpressionEntries();
    updatePreview();
  });

  dom.addVocabBtn.addEventListener("click", () => {
    vocab.push({ word: "", reading: "", meaning: "", part: "", usage: "", example: "", exampleTranslation: "" });
    renderVocabEntries();
    updatePreview();
  });

  dom.addGrammarBtn.addEventListener("click", () => {
    grammar.push({ pattern: "", explanation: "", usage: "", example: "", exampleTranslation: "" });
    renderGrammarEntries();
    updatePreview();
  });

  dom.applyExpressionJsonBtn.addEventListener("click", () => {
    applyJsonInput(dom.expressionJsonInput, expressions, normalizeExpression, renderExpressionEntries, "표현");
  });

  dom.applyVocabJsonBtn.addEventListener("click", () => {
    applyJsonInput(dom.vocabJsonInput, vocab, normalizeVocab, renderVocabEntries, "단어");
  });

  dom.applyGrammarJsonBtn.addEventListener("click", () => {
    applyJsonInput(dom.grammarJsonInput, grammar, normalizeGrammar, renderGrammarEntries, "문법");
  });

  dom.qrImage.addEventListener("change", () => {
    handleQrUpload(dom.qrImage.files[0]);
  });

  dom.savePdfBtn.addEventListener("click", exportPdf);
}

function init() {
  renderDifficultyStars();
  renderExpressionEntries();
  renderVocabEntries();
  renderGrammarEntries();
  bindEvents();
  updatePreview();
}

init();
