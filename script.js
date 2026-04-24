// Site UI: theme + disclaimer
const THEME_KEY = "gvat-theme";
const DISCLAIMER_KEY = "gvat-disclaimer-accepted";

function setStoredTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        /* ignore */
    }
}

function applyTheme(theme) {
    const t = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);
    setStoredTheme(t);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.setAttribute("data-mode", t);
        btn.setAttribute("aria-pressed", t === "light" ? "true" : "false");
        btn.setAttribute("aria-label", t === "dark" ? "Use light color theme" : "Use dark color theme");
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

// Constants
const NEAR_MAX_M = 0.4064;    // <= 16 inches
const FAR_MIN_M  = 3.048;     // >= 120 inches (10 feet)

// Logic ported from Python
function toMeters(value, unit) {
    if (unit === 'in') {
        return value * 0.0254;
    } else if (unit === 'ft') {
        return value * 0.3048;
    } else if (unit === 'mm') {
        return value / 1000.0;
    }
    throw new Error(`Unrecognized unit '${unit}'`);
}

function calculateExactVisualAngle(size_m, distance_m) {
    // Exact geometric formula: 2 * arctan(size / (2 * distance))
    const angle_rad = 2.0 * Math.atan(size_m / (2.0 * distance_m));
    return angle_rad * (10800.0 / Math.PI);
}

function calculateSnellenDenominator(visual_angle_minutes) {
    return (visual_angle_minutes / 5.0) * 20.0;
}

function classifyDistance(distance_m) {
    if (distance_m <= NEAR_MAX_M) {
        return "Near Vision";
    } else if (distance_m < FAR_MIN_M) {
        return "Intermediate Vision";
    } else {
        return "Far Vision (Distance)";
    }
}

function calculateDiopters(distance_m) {
    return 1.0 / distance_m;
}

// DOM Elements
const form = document.getElementById('acuity-form');
const resultsSection = document.getElementById('results-section');
const announcer = document.getElementById('result-announcer');

const sizeInput = document.getElementById('object-size-val');
const sizeUnit = document.getElementById('object-size-unit');
const sizeError = document.getElementById('size-error');

const distInput = document.getElementById('viewing-dist-val');
const distUnit = document.getElementById('viewing-dist-unit');
const distError = document.getElementById('dist-error');

function validateInput() {
    let isValid = true;
    sizeError.textContent = '';
    distError.textContent = '';
    
    // Reset aria-invalid
    sizeInput.setAttribute('aria-invalid', 'false');
    distInput.setAttribute('aria-invalid', 'false');

    if (!sizeInput.value || parseFloat(sizeInput.value) <= 0) {
        sizeError.textContent = 'Please enter a valid object size greater than 0.';
        sizeInput.setAttribute('aria-invalid', 'true');
        isValid = false;
    }

    if (!distInput.value || parseFloat(distInput.value) <= 0) {
        distError.textContent = 'Please enter a valid viewing distance greater than 0.';
        distInput.setAttribute('aria-invalid', 'true');
        isValid = false;
    }

    return isValid;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateInput()) {
        announcer.textContent = "Error in form submission. Please correct the invalid fields.";
        return;
    }

    const sizeVal = parseFloat(sizeInput.value);
    const sUnit = sizeUnit.value;
    
    const distVal = parseFloat(distInput.value);
    const dUnit = distUnit.value;

    try {
        const size_m = toMeters(sizeVal, sUnit);
        const distance_m = toMeters(distVal, dUnit);

        const zone = classifyDistance(distance_m);
        const visualAngleMin = calculateExactVisualAngle(size_m, distance_m);
        const snellenDenom = calculateSnellenDenominator(visualAngleMin);
        const needsAccommodation = (zone === "Near Vision" || zone === "Intermediate Vision");

        // Calculate conversions for display
        const distance_in = distance_m / 0.0254;
        const distance_ft = distance_m / 0.3048;
        const size_in = size_m / 0.0254;
        const size_mm = size_m * 1000;

        // Update DOM
        document.getElementById('res-size').textContent = `${sizeVal} ${sUnit}`;
        document.getElementById('res-size-conv').textContent = `(${size_in.toFixed(2)} in | ${size_mm.toFixed(1)} mm)`;
        
        document.getElementById('res-dist').textContent = `${distVal} ${dUnit}`;
        document.getElementById('res-dist-conv').textContent = `(${distance_in.toFixed(1)} in | ${distance_ft.toFixed(2)} ft | ${distance_m.toFixed(3)} m)`;

        document.getElementById('res-zone').textContent = zone;
        document.getElementById('res-angle').textContent = `${visualAngleMin.toFixed(2)} arc-minutes`;
        
        const finalAcuity = `20/${Math.round(snellenDenom)}`;
        document.getElementById('res-snellen').textContent = finalAcuity;

        let diopterText = "N/A (Far zone)";
        if (needsAccommodation) {
            const diopters = calculateDiopters(distance_m);
            diopterText = `${diopters.toFixed(2)} D`;
        }
        document.getElementById('res-diopters').textContent = diopterText;

        // Reveal results
        resultsSection.classList.remove('hidden');
        resultsSection.setAttribute('aria-hidden', 'false');

        // Build string for screen reader
        const sUnitText = sizeUnit.options[sizeUnit.selectedIndex].text;
        const dUnitText = distUnit.options[distUnit.selectedIndex].text;
        let announcement = `Calculation complete. For an object size of ${sizeVal} ${sUnitText} at a distance of ${distVal} ${dUnitText}, the equivalent visual acuity is 20 over ${Math.round(snellenDenom)}. The distance zone is ${zone}. `;
        if (needsAccommodation) {
            announcement += `The accommodative demand is ${diopterText}.`;
        } else {
            announcement += `There is no accommodative demand.`;
        }

        announcer.textContent = announcement;
        
        // Ensure visual focus goes to results for screen reader navigation if desired, 
        // but since we are using aria-live, the user gets it automatically.

    } catch (err) {
        announcer.textContent = `An error occurred during calculation: ${err.message}`;
    }
});

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initThemeToggle();
        initDisclaimerDialog();
    });
} else {
    initThemeToggle();
    initDisclaimerDialog();
}
