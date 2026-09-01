# PhishingUrlFinder — On-Device Phishing Detector with Explainable AI (Beta Version)

A Chrome extension that scores the URL of your current tab for phishing risk
and explains *why*, entirely on-device. No URL is ever sent to a server.

## How it's different from the "Standard" version

Instead of ONNX + `onnxruntime-web` (a WASM runtime you'd need to download
and bundle, ~7MB, extra moving part to demo live), the trained Random
Forest's tree structure is exported straight to a small JSON file
(`forest.json`, ~46KB) and walked by a ~70-line JS engine
(`forest_engine.js`). Same on-device guarantee, fewer dependencies, easier
to explain to an examiner in one sentence.

The explanations aren't hardcoded `if/else` strings either. `forest_engine.js`
implements **Saabas tree-path attribution** — the algorithm TreeSHAP was
built to generalize — computed live in the browser for the specific URL
being checked. Each split node in each tree contributes
`(child_probability − parent_probability)` to whichever feature it split
on; averaged across all 60 trees, this gives a real, signed importance
score per feature for *this exact URL*, not a generic global ranking.
`popup.js` then turns the top-ranked features into plain-English sentences.

## Project structure
```
training/
  generate_dataset.py   # synthetic dataset (swap for real data, see below)
  train_model.py         # trains RF, exports extension/forest.json
extension/
  manifest.json
  popup.html / popup.js  # UI + orchestration
  feature_extractor.js   # URL -> 12 lexical features (mirrors Python exactly)
  forest_engine.js        # tree walker + Saabas explainer
  forest.json              # exported model (generated, ~46KB)
  icon16/32/48/128.png
```

## Run it
1. `chrome://extensions` → enable **Developer Mode** → **Load unpacked** →
   select the `extension/` folder.
2. Click the shield icon on any page. It scores the current tab's URL.

No build step, no npm install, no downloads at runtime — that's the point.

## Retraining on a real dataset
`generate_dataset.py` produces **synthetic** data with rule-based patterns,
which is why `train_model.py` currently reports ~100% test accuracy — it's
recovering rules it was constructed from, not real-world signal. For your
actual submission, replace `phishing_urls.csv` with real data:

- Phishing URLs: [PhishTank](https://phishtank.org/) or
  [OpenPhish](https://openphish.com/) feeds
- Legitimate URLs: [Tranco list](https://tranco-list.eu/) top sites
- Keep the same 12 columns in `generate_dataset.py`'s `FEATURE_NAMES`
  (or add your own — just extend `feature_extractor.js` to match, feature
  order must be identical in both).
- Re-run `python3 train_model.py` — it overwrites `extension/forest.json`.
  Expect realistic accuracy in the 95–98% range with a real dataset, which
  is a more defensible number in a viva than 100%.

## Talking points for your presentation
- **Architecture**: `URL string → JS lexical feature extractor → Random
  Forest walked natively in JS → Saabas attribution → plain-English UI`.
  Zero network calls at inference time.
- **Privacy**: browsing history never leaves the device — directly
  addresses the "how do you avoid this becoming a surveillance tool"
  question an examiner is likely to ask.
- **Explainability**: attribution is computed per-URL, live, from the
  actual model — you can show two phishing URLs getting flagged for
  *different* reasons (one for raw-IP hosting, another for a shortener),
  which is a much stronger demo than a static rule table.
- **Cost**: $0 infrastructure — no server, no API, scales to any number of
  users for free. Good answer to "how would this work as a SaaS/consumer
  product."
- **Known limitation to state upfront** (examiners respect this more than
  a project that claims to solve everything): lexical/structural features
  alone can't catch a phishing page hosted on a freshly-registered but
  otherwise clean-looking domain with no suspicious keywords. A production
  version would add an opt-in second layer (e.g. querying Google Web Risk)
  for borderline scores only — which reintroduces a privacy trade-off worth
  discussing rather than hiding.
