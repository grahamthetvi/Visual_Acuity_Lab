# Visual Acuity Lab

Calculate equivalent Snellen visual acuity from an object's physical size and viewing distance.

**Live site:** [visualacuitylab.com](https://visualacuitylab.com)

## What it does

This is a static, client-side calculator for clinicians, students, and anyone who needs a quick equivalent acuity estimate. Enter an object's size and how far away it is, and the tool reports:

- Equivalent Snellen acuity (20/X)
- Alternate formats: MAR, LogMAR, decimal, metric (6/X), and M-units
- Distance zone (near, intermediate, far)
- Visual angle in arc-minutes
- Accommodative demand in diopters (when applicable)

The clinical formulas are documented in the UI under **Clinical Logic & Formulas (For Professionals)**.

## Features

- No build step — plain HTML, CSS, and JavaScript
- Light and dark themes (remembers your preference)
- English, Spanish, French, German, Simplified Chinese, Japanese, Vietnamese, and Arabic (with full RTL support)
- Accessible forms, live regions, skip link, and a first-visit disclaimer
- Deployed automatically to GitHub Pages with a custom domain

## Run locally

From the repository root:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Any static file server works. The locale loader resolves paths from the directory that serves `script.js`, so project-style GitHub Pages URLs (for example `/Visual_Acuity_Lab/`) work without extra configuration.

## Project structure

```
.
├── index.html          # Page markup and inline boot scripts (theme + locale)
├── privacy.html        # Privacy policy (client-side, no data collection)
├── style.css           # Layout, themes, RTL-aware styles
├── script.js           # i18n, theme, disclaimer, calculator logic
├── favicon.svg
├── locales/
│   ├── en.json         # English strings
│   ├── es.json         # Spanish strings
│   ├── fr.json         # French strings
│   ├── de.json         # German strings
│   ├── zh.json         # Simplified Chinese strings
│   ├── ja.json         # Japanese strings
│   ├── vi.json         # Vietnamese strings
│   └── ar.json         # Arabic strings
├── CNAME               # Custom domain for GitHub Pages
└── .github/workflows/
    └── deploy.yml      # Publishes the public site files to GitHub Pages
```

Only the files copied in the deploy workflow are published. Development-only files in the repo (such as `gemini-code-*.py`) are not deployed.

## Adding or editing translations

1. Add or update keys in every file under `locales/` (start with `en.json`, then keep the others in sync).
2. Reference keys in HTML with `data-i18n`, `data-i18n-html`, `data-i18n-aria-label`, `data-i18n-title`, or `data-i18n-placeholder`.
3. For dynamic text in `script.js`, use `t("key")` or `t("key", { var: value })` with `{var}` placeholders in the JSON.

To add a new language:

1. Create `locales/<code>.json`.
2. Add the locale to `SUPPORTED_LOCALES` and `LOCALE_META` in `script.js`.
3. Add an `<option>` to the language `<select>` in `index.html`.
4. Extend the inline locale boot script in `index.html` if early `dir`/`lang` application should support the new language.

## Deployment

Pushes to `main` trigger [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which uploads the public site files to GitHub Pages. The custom domain is set via `CNAME`.

## Disclaimer

Results are for informational purposes only and are **not** medical, legal, or professional advice. See the on-site disclaimer for full terms.

## License

[MIT](LICENSE) — Copyright (c) 2026 Addison Graham
