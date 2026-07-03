/**
 * NHK Easy News Thumbnail Generator
 * Vanilla JS — 역할별 모듈 분리
 */

/* ==========================================================================
   Constants
   ========================================================================== */

const STORAGE_KEYS = {
  category: "nhk_thumb_category",
  colorTheme: "nhk_thumb_color_theme",
  darkMode: "nhk_thumb_dark_mode",
};

const CATEGORY_OPTIONS = [
  "JLPT N5",
  "JLPT N4",
  "JLPT N3",
  "JLPT N2",
  "JLPT N1",
  "여행 일본어",
  "정치",
  "경제",
  "사회",
  "문화",
];

const DEFAULT_CATEGORY = "JLPT N3";

const COLOR_THEMES = ["green", "blue", "orange", "red", "purple", "gray"];

const THEME_COLORS = {
  green: "#2e7d32",
  blue: "#1565c0",
  orange: "#e65100",
  red: "#c62828",
  purple: "#6a1b9a",
  gray: "#546e7a",
};

const KOREAN_FONT_RULES = [
  { maxLength: 10, size: 78 },
  { maxLength: 20, size: 68 },
  { maxLength: 30, size: 58 },
  { maxLength: Infinity, size: 48 },
];

const JAPANESE_FONT_RULES = [
  { maxLength: 12, size: 56 },
  { maxLength: 24, size: 50 },
  { maxLength: 36, size: 46 },
  { maxLength: Infinity, size: 42 },
];

/* ==========================================================================
   DOM References
   ========================================================================== */

const dom = {
  app: document.body,
  koreanTitle: document.getElementById("koreanTitle"),
  japaneseTitle: document.getElementById("japaneseTitle"),
  categoryPicker: document.getElementById("categoryPicker"),
  previewCategory: document.getElementById("previewCategory"),
  previewEpisode: document.getElementById("previewEpisode"),
  episode: document.getElementById("episode"),
  previewKoreanTitle: document.getElementById("previewKoreanTitle"),
  previewJapaneseTitle: document.getElementById("previewJapaneseTitle"),
  previewTags: document.getElementById("previewTags"),
  thumbnail: document.getElementById("thumbnail"),
  colorThemePicker: document.getElementById("colorThemePicker"),
  themeModeBtn: document.getElementById("themeModeBtn"),
  themeModeIcon: document.getElementById("themeModeIcon"),
  savePngBtn: document.getElementById("savePngBtn"),
  saveJpgBtn: document.getElementById("saveJpgBtn"),
  loadingOverlay: document.getElementById("loadingOverlay"),
};

/* ==========================================================================
   Storage Module
   ========================================================================== */

/** localStorage에서 값을 읽는다 */
function loadFromStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** localStorage에 값을 저장한다 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

/** JLPT, 카테고리 등 저장된 폼 값을 복원한다 */
function restoreFormValues() {
  const savedCategory =
    loadFromStorage(STORAGE_KEYS.category) ||
    loadFromStorage("nhk_thumb_jlpt") ||
    DEFAULT_CATEGORY;
  const savedColorTheme = loadFromStorage(STORAGE_KEYS.colorTheme);
  const savedDarkMode = loadFromStorage(STORAGE_KEYS.darkMode);

  setCategory(savedCategory, { persist: false });
  if (savedColorTheme && COLOR_THEMES.includes(savedColorTheme)) {
    setColorTheme(savedColorTheme);
  }
  if (savedDarkMode === "true") {
    setDarkMode(true);
  }
}

/** 선택된 카테고리를 localStorage에 저장한다 */
function persistFormValues() {
  saveToStorage(STORAGE_KEYS.category, getSelectedCategory());
}

/** 현재 선택된 카테고리 값을 반환한다 */
function getSelectedCategory() {
  const activeBtn = dom.categoryPicker.querySelector(".category-picker__btn.is-active");
  return activeBtn?.dataset.category || DEFAULT_CATEGORY;
}

/**
 * 카테고리 선택 상태를 적용한다
 * @param {string} category
 * @param {{ persist?: boolean }} options
 */
function setCategory(category, { persist = true } = {}) {
  const value = CATEGORY_OPTIONS.includes(category) ? category : DEFAULT_CATEGORY;

  dom.categoryPicker.querySelectorAll(".category-picker__btn").forEach((btn) => {
    const isActive = btn.dataset.category === value;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  if (persist) {
    saveToStorage(STORAGE_KEYS.category, value);
  }
}

/* ==========================================================================
   Font Size Module
   ========================================================================== */

/**
 * 글자 수에 따라 폰트 크기를 계산한다
 * @param {string} text
 * @param {Array<{maxLength: number, size: number}>} rules
 * @returns {number}
 */
function calculateFontSize(text, rules) {
  const length = text.trim().length || 0;
  const rule = rules.find((r) => length <= r.maxLength);
  return rule ? rule.size : rules[rules.length - 1].size;
}

/** 한국어 제목 폰트 크기 (48~78px) */
function getKoreanFontSize(text) {
  return calculateFontSize(text, KOREAN_FONT_RULES);
}

/** 일본어 제목 폰트 크기 (42~56px) */
function getJapaneseFontSize(text) {
  return calculateFontSize(text, JAPANESE_FONT_RULES);
}

/* ==========================================================================
   Formatting Module
   ========================================================================== */

/**
 * 회차번호를 #001 형식으로 포맷한다
 * @param {string|number} value
 * @returns {string}
 */
function formatEpisode(value) {
  const raw = String(value).trim();
  if (!raw) return "";
  const num = parseInt(raw, 10);
  if (Number.isNaN(num) || num < 0) return "";
  return `#${String(num).padStart(3, "0")}`;
}

/**
 * 다운로드 파일명을 생성한다
 * 예: 023_정시에출발하다.png
 * @param {string} episode
 * @param {string} koreanTitle
 * @param {string} ext
 * @returns {string}
 */
function generateFilename(episode, koreanTitle, ext) {
  const epNum = parseInt(String(episode).trim(), 10);
  const epPart = Number.isNaN(epNum) ? "000" : String(epNum).padStart(3, "0");
  const titlePart = koreanTitle
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\uAC00-\uD7A3\u3131-\u318Ea-zA-Z0-9]/g, "");
  const safeTitle = titlePart || "thumbnail";
  return `${epPart}_${safeTitle}.${ext}`;
}

/* ==========================================================================
   Theme Module
   ========================================================================== */

/** 컬러 테마를 적용한다 */
function setColorTheme(theme) {
  COLOR_THEMES.forEach((t) => {
    dom.app.classList.remove(`app--theme-${t}`);
  });
  dom.app.classList.add(`app--theme-${theme}`);
  dom.thumbnail.dataset.theme = theme;

  const accent = THEME_COLORS[theme];
  dom.thumbnail.style.setProperty("--thumb-accent", accent);

  dom.colorThemePicker.querySelectorAll(".theme-picker__btn").forEach((btn) => {
    const isActive = btn.dataset.theme === theme;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  saveToStorage(STORAGE_KEYS.colorTheme, theme);
}

/** 다크모드를 토글한다 */
function setDarkMode(isDark) {
  dom.app.classList.toggle("app--dark", isDark);
  dom.app.classList.toggle("app--light", !isDark);
  dom.themeModeIcon.textContent = isDark ? "☀️" : "🌙";
  dom.themeModeBtn.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크모드로 전환");
  saveToStorage(STORAGE_KEYS.darkMode, String(isDark));
}

function toggleDarkMode() {
  const isDark = !dom.app.classList.contains("app--dark");
  setDarkMode(isDark);
}

/* ==========================================================================
   Preview Module
   ========================================================================== */

/**
 * textarea 입력값을 미리보기용 텍스트로 정규화한다 (줄바꿈 유지)
 * @param {string} value
 * @returns {string}
 */
function normalizeMultilineText(value) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** 미리보기를 실시간 업데이트한다 */
function updatePreview() {
  const koreanRaw = normalizeMultilineText(dom.koreanTitle.value);
  const japaneseRaw = normalizeMultilineText(dom.japaneseTitle.value);
  const korean = koreanRaw.trim() ? koreanRaw : "한국어 제목을 입력하세요";
  const japanese = japaneseRaw.trim() ? japaneseRaw : "日本語タイトルを入力してください";
  const category = getSelectedCategory();
  const episodeFormatted = formatEpisode(dom.episode.value);

  dom.previewKoreanTitle.textContent = korean;
  dom.previewJapaneseTitle.textContent = japanese;
  dom.previewCategory.textContent = category;
  dom.previewEpisode.textContent = episodeFormatted || "";
  dom.previewEpisode.hidden = !episodeFormatted;

  const koSize = getKoreanFontSize(koreanRaw.trim() || korean);
  const jpSize = getJapaneseFontSize(japaneseRaw.trim() || japanese);

  dom.previewKoreanTitle.style.fontSize = `${koSize}px`;
  dom.previewJapaneseTitle.style.fontSize = `${jpSize}px`;

  persistFormValues();
}

/* ==========================================================================
   Export Module
   ========================================================================== */

/** 로딩 오버레이 표시/숨김 */
function showLoading(show) {
  dom.loadingOverlay.hidden = !show;
  dom.loadingOverlay.setAttribute("aria-hidden", String(!show));
}

/**
 * html2canvas로 썸네일을 이미지로 저장한다
 * @param {"png"|"jpeg"} format
 * @param {boolean} showLoader - PNG 저장 시 1초 로딩 표시
 */
async function exportThumbnail(format, showLoader = false) {
  if (typeof html2canvas === "undefined") {
    alert("html2canvas 라이브러리를 불러올 수 없습니다. 인터넷 연결을 확인해 주세요.");
    return;
  }

  if (showLoader) {
    showLoading(true);
    await delay(1000);
  }

  const thumb = dom.thumbnail;
  const prevTransform = thumb.style.transform;

  try {
    /* 캡처 시 scale 변환을 제거해 1200×1200 원본 크기로 렌더링 */
    thumb.style.transform = "translateX(-50%) scale(1)";

    const canvas = await html2canvas(thumb, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#f7f6f3",
      logging: false,
      width: 1200,
      height: 1200,
    });

    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const quality = format === "jpeg" ? 0.95 : undefined;
    const ext = format === "png" ? "png" : "jpg";

    const dataUrl = canvas.toDataURL(mimeType, quality);
    const filename = generateFilename(
      dom.episode.value,
      dom.koreanTitle.value,
      ext
    );

    downloadDataUrl(dataUrl, filename);
  } catch (err) {
    console.error("Export failed:", err);
    alert("이미지 저장에 실패했습니다. 다시 시도해 주세요.");
  } finally {
    thumb.style.transform = prevTransform;
    if (showLoader) showLoading(false);
  }
}

/** Data URL을 파일로 다운로드한다 */
function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

/** 지정 ms 만큼 대기한다 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ==========================================================================
   Event Handlers
   ========================================================================== */

/** 입력 이벤트 리스너를 등록한다 */
function bindInputEvents() {
  [dom.koreanTitle, dom.japaneseTitle, dom.episode].forEach((input) => {
    input.addEventListener("input", updatePreview);
  });

  dom.categoryPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-picker__btn");
    if (!btn) return;
    setCategory(btn.dataset.category);
    updatePreview();
  });
}

/** 컬러 테마 버튼 이벤트 */
function bindThemeEvents() {
  dom.colorThemePicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-picker__btn");
    if (!btn) return;
    setColorTheme(btn.dataset.theme);
  });

  dom.themeModeBtn.addEventListener("click", toggleDarkMode);
}

/** 저장 버튼 이벤트 */
function bindExportEvents() {
  dom.savePngBtn.addEventListener("click", () => exportThumbnail("png", true));
  dom.saveJpgBtn.addEventListener("click", () => exportThumbnail("jpeg", false));
}

/* ==========================================================================
   Init
   ========================================================================== */

function init() {
  restoreFormValues();
  bindInputEvents();
  bindThemeEvents();
  bindExportEvents();
  updatePreview();
}

init();
