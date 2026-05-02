// Site UI: theme, disclaimer, i18n, calculator
const THEME_KEY = "gvat-theme";
const DISCLAIMER_KEY = "gvat-disclaimer-accepted";
const LANG_KEY = "gvat-lang";

const SUPPORTED_LOCALES = ["en", "ar"];

const LOCALE_META = {
    en: { htmlLang: "en", dir: "ltr" },
    ar: { htmlLang: "ar", dir: "rtl" },
};

/** @type {Record<string, string>} */
let messages = {};

function interpolate(str, vars) {
    if (!str || !vars) return str;
    return str.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined && vars[name] !== null ? String(vars[name]) : `{${name}}`));
}

function t(key, vars) {
    const raw = messages[key];
    const s = raw !== undefined ? raw : key;
    return vars ? interpolate(s, vars) : s;
}

function normalizeLocale(code) {
    if (!code || typeof code !== "string") return "en";
    const base = code.toLowerCase().split("-")[0];
    return SUPPORTED_LOCALES.includes(base) ? base : "en";
}

function pickLocaleFromBrowser() {
    const list = [];
    try {
        if (navigator.languages && navigator.languages.length) {
            list.push(...navigator.languages);
        }
    } catch {
        /* ignore */
    }
    try {
        if (navigator.language) list.push(navigator.language);
    } catch {
        /* ignore */
    }
    for (const lang of list) {
        const hit = normalizeLocale(lang);
        if (SUPPORTED_LOCALES.includes(hit)) return hit;
    }
    return "en";
}

function getStoredLocale() {
    try {
        const v = localStorage.getItem(LANG_KEY);
        if (v && SUPPORTED_LOCALES.includes(v)) return v;
    } catch {
        /* ignore */
    }
    return null;
}

/**
 * Directory URL where script.js is served from (trailing slash).
 * Resolves correctly for project sites (e.g. GitHub Pages /repo/ without trailing slash on the page URL).
 */
function getAssetBaseUrl() {
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i--) {
        const src = scripts[i].src;
        if (!src || !/\/script\.js(\?|#|$)/i.test(src)) continue;
        try {
            const u = new URL(src);
            const p = u.pathname;
            const slash = p.lastIndexOf("/");
            const dir = slash >= 0 ? p.slice(0, slash + 1) : "/";
            return `${u.origin}${dir}`;
        } catch {
            /* ignore */
        }
    }
    return new URL("./", window.location.href).href;
}

async function loadMessages(locale) {
    const base = getAssetBaseUrl();
    const url = new URL(`locales/${locale}.json`, base).href;
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load locale ${locale}`);
    return res.json();
}

function applyDocumentLang(locale) {
    const meta = LOCALE_META[locale] || LOCALE_META.en;
    document.documentElement.lang = meta.htmlLang;
    document.documentElement.dir = meta.dir;
}

function applyMetaAndTitle() {
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.description"));
    document.title = t("page.title");
}

function applyStaticI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (!key) return;
        el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
        const key = el.getAttribute("data-i18n-html");
        if (!key) return;
        el.innerHTML = t(key);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
        const key = el.getAttribute("data-i18n-aria-label");
        if (!key) return;
        el.setAttribute("aria-label", t(key));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title");
        if (!key) return;
        el.setAttribute("title", t(key));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (!key) return;
        el.setAttribute("placeholder", t(key));
    });
}

function refreshLangSwitcher() {
    const sel = document.getElementById("lang-switcher");
    if (!sel) return;
    sel.querySelectorAll("option").forEach((opt) => {
        const code = opt.value;
        const key = `lang.name.${code}`;
        if (messages[key]) opt.textContent = t(key);
    });
    sel.setAttribute("title", t("langSwitcher.title"));
    sel.setAttribute("aria-label", t("langSwitcher.title"));
}

function setStoredLocale(locale) {
    try {
        localStorage.setItem(LANG_KEY, locale);
    } catch {
        /* ignore */
    }
}

async function setLocale(locale) {
    const code = normalizeLocale(locale);
    try {
        const loaded = await loadMessages(code);
        return setLocaleWithMessages(code, loaded);
    } catch {
        if (code !== "en") {
            const loaded = await loadMessages("en");
            return setLocaleWithMessages("en", loaded);
        }
        throw new Error("Could not load translations");
    }
}

function setLocaleWithMessages(code, loaded) {
    messages = loaded;
    applyDocumentLang(code);
    applyMetaAndTitle();
    applyStaticI18n();
    refreshLangSwitcher();
    const sel = document.getElementById("lang-switcher");
    if (sel) sel.value = code;
    setStoredLocale(code);
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(theme);
    refreshSupportLinkAttributes();
    if (typeof window.__gvatRefreshResults === "function") {
        window.__gvatRefreshResults();
    }
    return code;
}

function refreshSupportLinkAttributes() {
    const link = document.getElementById("support-link");
    if (!link) return;
    link.setAttribute("title", t("support.title"));
    link.setAttribute("aria-label", t("support.ariaLabel"));
}

function setStoredTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        /* ignore */
    }
}

function applyTheme(theme) {
    const tTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", tTheme);
    setStoredTheme(tTheme);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.setAttribute("data-mode", tTheme);
        btn.setAttribute("aria-pressed", tTheme === "light" ? "true" : "false");
        btn.setAttribute("aria-label", tTheme === "dark" ? t("theme.ariaLabelDark") : t("theme.ariaLabelLight"));
        btn.setAttribute("title", t("theme.title"));
    }
}

function initThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current);
    btn.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        applyTheme(next);
    });
}

function initDisclaimerDialog() {
    const dialog = document.getElementById("disclaimer-dialog");
    const main = document.getElementById("main");
    const accept = document.getElementById("disclaimer-accept");
    if (!dialog || !accept) return;
    let accepted = false;
    try {
        accepted = localStorage.getItem(DISCLAIMER_KEY) === "1";
    } catch {
        accepted = false;
    }
    if (accepted) {
        if (main) main.removeAttribute("inert");
        return;
    }
    if (main) main.setAttribute("inert", "");
    if (typeof dialog.showModal === "function") {
        dialog.showModal();
    }
    const closeAndRemember = () => {
        try {
            localStorage.setItem(DISCLAIMER_KEY, "1");
        } catch {
            /* ignore */
        }
        if (main) main.removeAttribute("inert");
        dialog.close();
    };
    accept.addEventListener("click", closeAndRemember);
    dialog.addEventListener("cancel", (e) => {
        e.preventDefault();
    });
}

function initLangSwitcher() {
    const sel = document.getElementById("lang-switcher");
    if (!sel) return;
    sel.addEventListener("change", async () => {
        const v = normalizeLocale(sel.value);
        sel.disabled = true;
        try {
            await setLocale(v);
        } catch {
            sel.value = getStoredLocale() || "en";
        } finally {
            sel.disabled = false;
        }
    });
}

// --- Calculator ---
const NEAR_MAX_M = 0.4064;
const FAR_MIN_M = 3.048;

function toMeters(value, unit) {
    if (unit === "in") {
        return value * 0.0254;
    }
    if (unit === "ft") {
        return value * 0.3048;
    }
    if (unit === "mm") {
        return value / 1000.0;
    }
    if (unit === "cm") {
        return value / 100.0;
    }
    throw new Error(t("error.unrecognizedUnit", { unit }));
}

function calculateExactVisualAngle(size_m, distance_m) {
    const angle_rad = 2.0 * Math.atan(size_m / (2.0 * distance_m));
    return angle_rad * (10800.0 / Math.PI);
}

const SNELLEN_NUMERATOR = 20;
const METRIC_SNELLEN_NUM = 6;
const METRIC_SNELLEN_RATIO = METRIC_SNELLEN_NUM / SNELLEN_NUMERATOR;

function calculateSnellenDenominator(visual_angle_minutes) {
    return (visual_angle_minutes / 5.0) * 20.0;
}

function getAlternateAcuityFormats(d, distanceM) {
    if (!(d > 0) || !Number.isFinite(d)) {
        return null;
    }
    const mar = d / SNELLEN_NUMERATOR;
    const logMar = Math.log10(mar);
    const decimal = SNELLEN_NUMERATOR / d;
    const metricDenom = Math.round(d * METRIC_SNELLEN_RATIO);
    const mUnit = distanceM * (d / SNELLEN_NUMERATOR);
    return {
        mar,
        logMar,
        decimal,
        metricStr: `6/${metricDenom}`,
        mUnit,
    };
}

/** @returns {'near'|'intermediate'|'far'} */
function classifyDistanceZoneKey(distance_m) {
    if (distance_m <= NEAR_MAX_M) return "near";
    if (distance_m < FAR_MIN_M) return "intermediate";
    return "far";
}

function calculateDiopters(distance_m) {
    return 1.0 / distance_m;
}

const form = document.getElementById("acuity-form");
const resultsSection = document.getElementById("results-section");
const announcer = document.getElementById("result-announcer");

const sizeInput = document.getElementById("object-size-val");
const sizeUnit = document.getElementById("object-size-unit");
const sizeError = document.getElementById("size-error");

const distInput = document.getElementById("viewing-dist-val");
const distUnit = document.getElementById("viewing-dist-unit");
const distError = document.getElementById("dist-error");

/** @type {null | object} */
let lastCalcState = null;

function validateInput() {
    let isValid = true;
    sizeError.textContent = "";
    distError.textContent = "";

    sizeInput.setAttribute("aria-invalid", "false");
    distInput.setAttribute("aria-invalid", "false");

    if (!sizeInput.value || parseFloat(sizeInput.value) <= 0) {
        sizeError.textContent = t("validation.sizeError");
        sizeInput.setAttribute("aria-invalid", "true");
        isValid = false;
    }

    if (!distInput.value || parseFloat(distInput.value) <= 0) {
        distError.textContent = t("validation.distanceError");
        distInput.setAttribute("aria-invalid", "true");
        isValid = false;
    }

    return isValid;
}

function diopterDisplay(needsAccommodation, dioptersValue) {
    if (!needsAccommodation) return t("results.diopters.na");
    const unit = t("results.diopters.unit");
    return `${dioptersValue.toFixed(2)} ${unit}`;
}

function renderResultsFromState(state) {
    if (!state) return;

    const {
        sizeVal,
        sUnit,
        distVal,
        dUnit,
        size_m,
        distance_m,
        zoneKey,
        visualAngleMin,
        dSnellen,
        alt,
        needsAccommodation,
        dioptersValue,
    } = state;

    const distance_in = distance_m / 0.0254;
    const distance_ft = distance_m / 0.3048;
    const size_in = size_m / 0.0254;
    const size_mm = size_m * 1000;

    const sizeConv = interpolate(t("results.conversion.size"), {
        in: size_in.toFixed(2),
        mm: size_mm.toFixed(1),
    });
    const distConv = interpolate(t("results.conversion.distance"), {
        in: distance_in.toFixed(1),
        ft: distance_ft.toFixed(2),
        m: distance_m.toFixed(3),
    });

    const zoneLabel = t(`results.zone.${zoneKey}`);

    document.getElementById("res-size").textContent = `${sizeVal} ${sUnit}`;
    document.getElementById("res-size-conv").textContent = sizeConv;

    document.getElementById("res-dist").textContent = `${distVal} ${dUnit}`;
    document.getElementById("res-dist-conv").textContent = distConv;

    document.getElementById("res-zone").textContent = zoneLabel;
    document.getElementById("res-angle").textContent = `${visualAngleMin.toFixed(2)} ${t("results.angleUnit")}`;

    document.getElementById("res-snellen").textContent = `20/${dSnellen}`;

    if (alt) {
        document.getElementById("res-mar").textContent = `${alt.mar.toFixed(2)} ${t("results.marUnit")}`;
        document.getElementById("res-logmar").textContent = alt.logMar.toFixed(2);
        document.getElementById("res-decimal").textContent = alt.decimal.toFixed(2);
        document.getElementById("res-metric").textContent = alt.metricStr;
        document.getElementById("res-munit").textContent = `${alt.mUnit.toFixed(2)} M`;
    }

    const diopterText = diopterDisplay(needsAccommodation, dioptersValue);
    document.getElementById("res-diopters").textContent = diopterText;

    const sUnitText = sizeUnit.options[sizeUnit.selectedIndex].text;
    const dUnitText = distUnit.options[distUnit.selectedIndex].text;
    const altText = alt
        ? t("announce.altBlock", {
              mar: alt.mar.toFixed(2),
              logmar: alt.logMar.toFixed(2),
              decimal: alt.decimal.toFixed(2),
              metric: alt.metricStr,
              munits: alt.mUnit.toFixed(2),
          })
        : "";

    let announcement = t("announce.calcCompleteIntro", {
        sizeVal: String(sizeVal),
        sizeUnitLabel: sUnitText,
        distVal: String(distVal),
        distUnitLabel: dUnitText,
        d: String(dSnellen),
    });
    announcement += altText;
    announcement += t("announce.zone", { zone: zoneLabel });
    announcement += needsAccommodation
        ? t("announce.accommodationYes", { diopters: diopterText })
        : t("announce.accommodationNo");

    announcer.textContent = announcement;
}

window.__gvatRefreshResults = function () {
    if (lastCalcState) renderResultsFromState(lastCalcState);
};

function initCalculator() {
    if (!form || !sizeInput || !distInput || !sizeUnit || !distUnit || !sizeError || !distError || !resultsSection || !announcer) {
        return;
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!validateInput()) {
            announcer.textContent = t("announce.formError");
            return;
        }

        const sizeVal = parseFloat(sizeInput.value);
        const sUnit = sizeUnit.value;

        const distVal = parseFloat(distInput.value);
        const dUnit = distUnit.value;

        try {
            const size_m = toMeters(sizeVal, sUnit);
            const distance_m = toMeters(distVal, dUnit);

            const zoneKey = classifyDistanceZoneKey(distance_m);
            const visualAngleMin = calculateExactVisualAngle(size_m, distance_m);
            const snellenDenom = calculateSnellenDenominator(visualAngleMin);
            const needsAccommodation = zoneKey === "near" || zoneKey === "intermediate";

            const dSnellen = Math.round(snellenDenom);
            const alt = getAlternateAcuityFormats(dSnellen, distance_m);

            let dioptersValue = 0;
            if (needsAccommodation) {
                dioptersValue = calculateDiopters(distance_m);
            }

            lastCalcState = {
                sizeVal,
                sUnit,
                distVal,
                dUnit,
                size_m,
                distance_m,
                zoneKey,
                visualAngleMin,
                dSnellen,
                alt,
                needsAccommodation,
                dioptersValue,
            };

            resultsSection.classList.remove("hidden");
            resultsSection.setAttribute("aria-hidden", "false");

            renderResultsFromState(lastCalcState);
        } catch (err) {
            announcer.textContent = t("announce.calcError", { message: err.message });
        }
    });
}

async function initApp() {
    const stored = getStoredLocale();
    const initial = stored || pickLocaleFromBrowser();
    const code = normalizeLocale(initial);

    try {
        const loaded = await loadMessages(code);
        setLocaleWithMessages(code, loaded);
    } catch {
        const loaded = await loadMessages("en");
        setLocaleWithMessages("en", loaded);
    }

    initThemeToggle();
    initDisclaimerDialog();
    initLangSwitcher();
    initCalculator();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initApp();
    });
} else {
    initApp();
}
