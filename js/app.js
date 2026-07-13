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
  mode: "nhk_thumb_mode",
  travelStyle: "nhk_thumb_travel_style",
  dimColor: "nhk_thumb_dim_color",
  handlePosition: "nhk_thumb_handle_position",
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

const TRAVEL_TITLE_FONT_RULES = [
  { maxLength: 6, size: 130 },
  { maxLength: 12, size: 104 },
  { maxLength: 20, size: 82 },
  { maxLength: Infinity, size: 66 },
];

const HANDLE_POSITIONS = ["top-left", "top-right", "bottom-left", "bottom-right"];
const DEFAULT_HANDLE_POSITION = "bottom-right";
const TRAVEL_STYLES = ["brand", "qa"];
const DEFAULT_TRAVEL_STYLE = "brand";
const DIM_COLORS = ["black", "white"];
const DEFAULT_DIM_COLOR = "black";
const MODES = ["jp", "travel"];
const DEFAULT_MODE = "jp";

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

  modeTabs: document.getElementById("modeTabs"),
  jpFields: document.getElementById("jpFields"),
  travelFields: document.getElementById("travelFields"),

  thumbnailTravel: document.getElementById("thumbnailTravel"),
  travelImageInput: document.getElementById("travelImageInput"),
  imageUploadArea: document.getElementById("imageUploadArea"),
  imageRemoveBtn: document.getElementById("imageRemoveBtn"),
  travelBg: document.getElementById("travelBg"),
  travelDim: document.getElementById("travelDim"),
  travelStylePicker: document.getElementById("travelStylePicker"),
  dimColorPicker: document.getElementById("dimColorPicker"),
  dimOpacity: document.getElementById("dimOpacity"),
  dimOpacityValue: document.getElementById("dimOpacityValue"),
  travelBrand: document.getElementById("travelBrand"),
  travelTitle: document.getElementById("travelTitle"),
  travelSubtitle: document.getElementById("travelSubtitle"),
  travelSeries: document.getElementById("travelSeries"),
  travelHandle: document.getElementById("travelHandle"),
  handlePositionPicker: document.getElementById("handlePositionPicker"),
  previewTravelBrand: document.getElementById("previewTravelBrand"),
  previewTravelTitle: document.getElementById("previewTravelTitle"),
  previewTravelSubtitle: document.getElementById("previewTravelSubtitle"),
  previewTravelSeries: document.getElementById("previewTravelSeries"),
  previewTravelHandle: document.getElementById("previewTravelHandle"),
};

let currentMode = DEFAULT_MODE;

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
  const savedMode = loadFromStorage(STORAGE_KEYS.mode);
  const savedTravelStyle = loadFromStorage(STORAGE_KEYS.travelStyle);
  const savedDimColor = loadFromStorage(STORAGE_KEYS.dimColor);
  const savedHandlePosition = loadFromStorage(STORAGE_KEYS.handlePosition);

  setCategory(savedCategory, { persist: false });
  if (savedColorTheme && COLOR_THEMES.includes(savedColorTheme)) {
    setColorTheme(savedColorTheme);
  }
  if (savedDarkMode === "true") {
    setDarkMode(true);
  }
  setMode(savedMode && MODES.includes(savedMode) ? savedMode : DEFAULT_MODE, { persist: false });
  setTravelStyle(
    savedTravelStyle && TRAVEL_STYLES.includes(savedTravelStyle) ? savedTravelStyle : DEFAULT_TRAVEL_STYLE,
    { persist: false }
  );
  setDimColor(
    savedDimColor && DIM_COLORS.includes(savedDimColor) ? savedDimColor : DEFAULT_DIM_COLOR,
    { persist: false }
  );
  setHandlePosition(
    savedHandlePosition && HANDLE_POSITIONS.includes(savedHandlePosition)
      ? savedHandlePosition
      : DEFAULT_HANDLE_POSITION,
    { persist: false }
  );
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
   Mode Module
   ========================================================================== */

/**
 * 썸네일 유형(일본어 학습 / 여행 콘텐츠)을 전환한다
 * @param {"jp"|"travel"} mode
 * @param {{ persist?: boolean }} options
 */
function setMode(mode, { persist = true } = {}) {
  const value = MODES.includes(mode) ? mode : DEFAULT_MODE;
  currentMode = value;

  dom.jpFields.hidden = value !== "jp";
  dom.travelFields.hidden = value !== "travel";
  dom.thumbnail.hidden = value !== "jp";
  dom.thumbnailTravel.hidden = value !== "travel";

  dom.modeTabs.querySelectorAll(".mode-tabs__btn").forEach((btn) => {
    const isActive = btn.dataset.mode === value;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  if (persist) {
    saveToStorage(STORAGE_KEYS.mode, value);
  }
}

/* ==========================================================================
   Travel Thumbnail Module
   ========================================================================== */

/** 업로드된 이미지를 배경으로 적용한다 */
function handleImageUpload(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    dom.travelBg.style.backgroundImage = `url("${reader.result}")`;
    dom.imageUploadArea.classList.add("has-image");
    dom.imageRemoveBtn.hidden = false;
  };
  reader.readAsDataURL(file);
}

/** 업로드된 배경 이미지를 제거한다 */
function removeImage() {
  dom.travelBg.style.backgroundImage = "";
  dom.imageUploadArea.classList.remove("has-image");
  dom.imageRemoveBtn.hidden = true;
  dom.travelImageInput.value = "";
}

/** 여행 템플릿 스타일(브랜드형/정보형)을 적용한다 */
function setTravelStyle(style, { persist = true } = {}) {
  const value = TRAVEL_STYLES.includes(style) ? style : DEFAULT_TRAVEL_STYLE;
  dom.thumbnailTravel.dataset.style = value;

  dom.travelStylePicker.querySelectorAll(".category-picker__btn").forEach((btn) => {
    const isActive = btn.dataset.style === value;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  if (persist) {
    saveToStorage(STORAGE_KEYS.travelStyle, value);
  }
}

/** 딤 처리 색상(검정/흰색)을 적용한다 */
function setDimColor(color, { persist = true } = {}) {
  const value = DIM_COLORS.includes(color) ? color : DEFAULT_DIM_COLOR;
  dom.thumbnailTravel.dataset.dim = value;

  dom.dimColorPicker.querySelectorAll(".category-picker__btn").forEach((btn) => {
    const isActive = btn.dataset.dim === value;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  if (persist) {
    saveToStorage(STORAGE_KEYS.dimColor, value);
  }
}

/** 딤 처리 농도(0~90%)를 적용한다 */
function setDimOpacity(value) {
  const percent = Math.min(90, Math.max(0, parseInt(value, 10) || 0));
  dom.travelDim.style.setProperty("--dim-opacity", String(percent / 100));
  dom.dimOpacityValue.textContent = `${percent}%`;
}

/** 블로그 주소 위치(4모서리)를 적용한다 */
function setHandlePosition(position, { persist = true } = {}) {
  const value = HANDLE_POSITIONS.includes(position) ? position : DEFAULT_HANDLE_POSITION;

  HANDLE_POSITIONS.forEach((pos) => {
    dom.previewTravelHandle.classList.remove(`thumbnail__travel-handle--${pos}`);
  });
  dom.previewTravelHandle.classList.add(`thumbnail__travel-handle--${value}`);

  dom.handlePositionPicker.querySelectorAll(".corner-picker__btn").forEach((btn) => {
    const isActive = btn.dataset.position === value;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  if (persist) {
    saveToStorage(STORAGE_KEYS.handlePosition, value);
  }
}

/** 여행 썸네일 미리보기를 실시간 업데이트한다 */
function updateTravelPreview() {
  const brand = dom.travelBrand.value.trim();
  const titleRaw = normalizeMultilineText(dom.travelTitle.value);
  const subtitle = dom.travelSubtitle.value.trim();
  const series = dom.travelSeries.value.trim();
  const handle = dom.travelHandle.value.trim();

  dom.previewTravelBrand.textContent = brand || "🇯🇵 오키나와";
  dom.previewTravelTitle.textContent = titleRaw.trim() || "제목을 입력하세요";
  dom.previewTravelSubtitle.textContent = subtitle;
  dom.previewTravelSeries.textContent = series;
  dom.previewTravelHandle.textContent = handle;

  const titleSize = calculateFontSize(titleRaw.trim() || "제목을 입력하세요", TRAVEL_TITLE_FONT_RULES);
  dom.previewTravelTitle.style.fontSize = `${titleSize}px`;
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
  const epDigits = String(episode).replace(/[^0-9]/g, "");
  const epNum = parseInt(epDigits, 10);
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
  dom.thumbnailTravel.dataset.theme = theme;

  const accent = THEME_COLORS[theme];
  dom.thumbnail.style.setProperty("--thumb-accent", accent);
  dom.thumbnailTravel.style.setProperty("--thumb-accent", accent);

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
 * 미리보기 요소의 계산된 스타일을 캡처용 복제 노드에 인라인으로 복사한다
 * (html2canvas가 외부 폰트·동적 스타일을 누락하는 문제 방지)
 */
function syncCaptureStyles(source, target) {
  const pairs = [
    [".thumbnail__title-ko", ["fontFamily", "fontSize", "fontWeight", "color", "whiteSpace", "lineHeight", "letterSpacing"]],
    [".thumbnail__title-jp", ["fontFamily", "fontSize", "fontWeight", "color", "whiteSpace", "lineHeight", "letterSpacing"]],
    [".thumbnail__series", ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing"]],
    [".thumbnail__tags-label", ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing"]],
    [".thumbnail__tags-episode", ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing"]],
    [".thumbnail__copyright", ["fontFamily", "fontSize", "color", "letterSpacing"]],
    [".thumbnail__logo", ["backgroundColor", "width", "height", "borderRadius"]],
    [".thumbnail__travel-brand", ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing", "textShadow"]],
    [".thumbnail__travel-title", ["fontFamily", "fontSize", "fontWeight", "color", "lineHeight", "letterSpacing", "whiteSpace", "textShadow"]],
    [".thumbnail__travel-subtitle", ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing", "textShadow"]],
    [".thumbnail__travel-series", ["fontFamily", "fontSize", "fontWeight", "color", "opacity"]],
    [".thumbnail__travel-handle", ["fontFamily", "fontSize", "fontWeight", "color", "backgroundColor"]],
    [".thumbnail__travel-dim", ["backgroundColor", "opacity"]],
    [".thumbnail__travel-bg", ["backgroundImage", "backgroundSize", "backgroundPosition", "backgroundColor"]],
  ];

  pairs.forEach(([selector, props]) => {
    const src = source.querySelector(selector);
    const dst = target.querySelector(selector);
    if (!src || !dst) return;

    const computed = getComputedStyle(src);
    props.forEach((prop) => {
      dst.style[prop] = computed[prop];
    });
  });

  const srcAccent = getComputedStyle(source).getPropertyValue("--thumb-accent").trim();
  if (srcAccent) {
    target.style.setProperty("--thumb-accent", srcAccent);
  }
}

/**
 * 캡처용 오프스크린 노드를 만든다 (transform·클리핑 없이 1200×1200 그대로 렌더)
 * @param {HTMLElement} source
 * @returns {{ wrapper: HTMLElement, node: HTMLElement }}
 */
function createCaptureNode(source) {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText =
    "position:fixed;left:-10000px;top:0;width:1200px;height:1200px;overflow:visible;pointer-events:none;z-index:-1;";

  const node = source.cloneNode(true);
  node.removeAttribute("id");
  node.style.cssText =
    "position:static;transform:none;left:auto;top:auto;width:1200px;height:1200px;margin:0;overflow:hidden;";

  syncCaptureStyles(source, node);

  wrapper.appendChild(node);
  document.body.appendChild(wrapper);
  return { wrapper, node };
}

/** 캡처 전 웹폰트가 로드될 때까지 대기한다 */
async function ensureFontsReady() {
  const samples = [
    `700 ${getKoreanFontSize(dom.koreanTitle.value)}px Pretendard`,
    `500 ${getJapaneseFontSize(dom.japaneseTitle.value)}px "Noto Sans JP"`,
    '500 32px "Noto Sans JP"',
    "500 30px Pretendard",
    `800 ${calculateFontSize(dom.travelTitle.value, TRAVEL_TITLE_FONT_RULES)}px Pretendard`,
    "600 36px Pretendard",
  ];

  await Promise.all([
    document.fonts.ready,
    ...samples.map((spec) => document.fonts.load(spec).catch(() => undefined)),
  ]);
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

  let captureRoot = null;

  try {
    await ensureFontsReady();

    const activeSource = currentMode === "travel" ? dom.thumbnailTravel : dom.thumbnail;
    const { wrapper, node } = createCaptureNode(activeSource);
    captureRoot = wrapper;

    /* 레이아웃 반영 후 캡처 */
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(node, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#f7f6f3",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, clonedNode) => {
        clonedNode.style.transform = "none";
        clonedNode.style.position = "static";
        clonedNode.style.width = "1200px";
        clonedNode.style.height = "1200px";

        let parent = clonedNode.parentElement;
        while (parent && parent !== clonedDoc.body) {
          parent.style.overflow = "visible";
          parent.style.transform = "none";
          parent = parent.parentElement;
        }
      },
    });

    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const quality = format === "jpeg" ? 0.95 : undefined;
    const ext = format === "png" ? "png" : "jpg";

    const dataUrl = canvas.toDataURL(mimeType, quality);
    const episodeForFilename = currentMode === "travel" ? dom.travelSeries.value : dom.episode.value;
    const titleForFilename = currentMode === "travel" ? dom.travelTitle.value : dom.koreanTitle.value;
    const filename = generateFilename(episodeForFilename, titleForFilename, ext);

    downloadDataUrl(dataUrl, filename);
  } catch (err) {
    console.error("Export failed:", err);
    alert("이미지 저장에 실패했습니다. 다시 시도해 주세요.");
  } finally {
    captureRoot?.remove();
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

/** 모드 탭 이벤트 */
function bindModeEvents() {
  dom.modeTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-tabs__btn");
    if (!btn) return;
    setMode(btn.dataset.mode);
  });
}

/** 여행 썸네일 관련 이벤트 */
function bindTravelEvents() {
  [dom.travelBrand, dom.travelTitle, dom.travelSubtitle, dom.travelSeries, dom.travelHandle].forEach((input) => {
    input.addEventListener("input", updateTravelPreview);
  });

  dom.travelImageInput.addEventListener("change", (e) => {
    handleImageUpload(e.target.files[0]);
  });

  dom.imageRemoveBtn.addEventListener("click", removeImage);

  dom.travelStylePicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-picker__btn");
    if (!btn) return;
    setTravelStyle(btn.dataset.style);
  });

  dom.dimColorPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-picker__btn");
    if (!btn) return;
    setDimColor(btn.dataset.dim);
  });

  dom.dimOpacity.addEventListener("input", (e) => {
    setDimOpacity(e.target.value);
  });

  dom.handlePositionPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".corner-picker__btn");
    if (!btn) return;
    setHandlePosition(btn.dataset.position);
  });
}

/* ==========================================================================
   Init
   ========================================================================== */

function init() {
  restoreFormValues();
  bindInputEvents();
  bindThemeEvents();
  bindExportEvents();
  bindModeEvents();
  bindTravelEvents();
  updatePreview();
  updateTravelPreview();
  setDimOpacity(dom.dimOpacity.value);
}

init();
