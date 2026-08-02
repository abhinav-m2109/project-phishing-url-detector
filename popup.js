onnxruntime-web
import * as ort from './onnxruntime.min.js';

async function analyzeCurrentURL() {
    // 1. Get Active Tab URL
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let features = extractURLFeatures(tab.url);

    // 2. Load ONNX Model & Run Local Inference
    const session = await ort.InferenceSession.create('./model.onnx');
    const inputTensor = new ort.Tensor('float32', Float32Array.from(features), [1, features.length]);
    
    const feeds = { float_input: inputTensor };
    const results = await session.run(feeds);
    const prediction = results.output_label.data[0]; // 1 = Phishing, 0 = Safe

    // 3. Load Local XAI Explanations
    const response = await fetch('xai_config.json');
    const xaiConfig = await response.json();

    renderUI(prediction, features, xaiConfig);
}

function renderUI(isPhishing, features, xaiConfig) {
    const statusDiv = document.getElementById("status");
    const xaiDiv = document.getElementById("explanations");

    if (isPhishing === 1) {
        statusDiv.innerHTML = `<h2 style="color:red;">🚨 DANGER: Phishing Link</h2>`;
        
        // Show Human-Readable SHAP Explanations
        let explanations = [];
        if (features[5] === 1) explanations.push("⚠️ Uses raw IP address instead of domain name");
        if (features[1] > 3) explanations.push("⚠️ Unusually high number of subdomains");
        if (features[4] === 0) explanations.push("⚠️ Unencrypted connection (No HTTPS)");

        xaiDiv.innerHTML = `<h3>Why it was flagged:</h3><ul>` + 
            explanations.map(e => `<li>${e}</li>`).join('') + `</ul>`;
    } else {
        statusDiv.innerHTML = `<h2 style="color:green;">✅ Safe Link</h2>`;
    }
}

document.addEventListener('DOMContentLoaded', analyzeCurrentURL);
