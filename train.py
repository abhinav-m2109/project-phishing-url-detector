import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import skl2onnx
from skl2onnx.common.data_types import FloatTensorType
import json
import shap

# 1. Load Dataset & Train Model
df = pd.read_csv("phishing_urls.csv") # Dataset containing URL features
X = df.drop(columns=['label'])
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 2. Export Model to ONNX Format (For Browser)
initial_type = [('float_input', FloatTensorType([None, X.shape[1]])) ]
onnx_model = skl2onnx.convert_sklearn(model, initial_types=initial_type)

with open("model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())

# 3. Export SHAP Baseline & Feature Names for Local XAI
explainer = shap.TreeExplainer(model)
feature_names = list(X.columns)

config = {
    "feature_names": feature_names,
    "feature_importances": model.feature_importances_.tolist()
}

with open("xai_config.json", "w") as f:
    json.dump(config, f)

print("✅ Model exported to model.onnx and xai_config.json created!")
