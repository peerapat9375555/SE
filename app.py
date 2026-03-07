import numpy as np
import onnxruntime as ort
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

# 1. Configuration
IMG_SIZE = 260
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
NUM_CLASSES = 22

CLASS_NAMES = ["Acne", "Actinic_Keratosis", "Benign_tumors", "Bullous", "Candidiasis", "DrugEruption", "Eczema", "Infestations_Bites", "Lichen", "Lupus", "Moles", "Psoriasis", "Rosacea", "Seborrh_Keratoses", "SkinCancer", "Sun_Sunlight_Damage", "Tinea", "Unknown_Normal", "Vascular_Tumors", "Vasculitis", "Vitiligo", "Warts"]
CLASS_NAMES_TH = {"Acne": "สิว", "Actinic_Keratosis": "ผื่นแดดเรื้อรัง", "Benign_tumors": "เนื้องอกไม่ร้ายแรง", "Bullous": "โรคผื่นพุพอง", "Candidiasis": "โรคเชื้อราแคนดิดา", "DrugEruption": "ผื่นจากยา", "Eczema": "โรคผิวหนังอักเสบ", "Infestations_Bites": "โรคจากแมลงกัดต่อย", "Lichen": "ไลเคน", "Lupus": "โรคลูปัส", "Moles": "ไฝ", "Psoriasis": "โรคสะเก็ดเงิน", "Rosacea": "โรคโรซาเซีย", "Seborrh_Keratoses": "ไฝแก่", "SkinCancer": "มะเร็งผิวหนัง", "Sun_Sunlight_Damage": "ผิวเสียจากแสงแดด", "Tinea": "โรคกลาก", "Unknown_Normal": "ปกติ/ไม่ทราบ", "Vascular_Tumors": "เนื้องอกหลอดเลือด", "Vasculitis": "โรคหลอดเลือดอักเสบ", "Vitiligo": "โรคด่างขาว", "Warts": "หูด"}

# 2. Load ONNX model (much lighter than PyTorch — ~100MB RAM vs ~500MB)
MODEL_PATH = 'model/best_model.onnx'
session = None

if os.path.exists(MODEL_PATH):
    session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
    print("Skin Classification Model Ready (ONNX Runtime)")
else:
    print(f"Warning: Model file not found at {MODEL_PATH}")


def preprocess_image(img):
    """Resize, normalize, and convert PIL image to numpy array for ONNX."""
    img = img.resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img, dtype=np.float32) / 255.0
    # Normalize
    img_array = (img_array - MEAN) / STD
    # HWC -> CHW -> NCHW
    img_array = np.transpose(img_array, (2, 0, 1))
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def softmax(x):
    """Compute softmax values."""
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()


@app.route('/api/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400

    if session is None:
        return jsonify({'error': 'Model not loaded'}), 500

    file = request.files['file']
    img = Image.open(io.BytesIO(file.read())).convert('RGB')
    img_array = preprocess_image(img)

    # Run ONNX inference
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: img_array})
    
    prob = softmax(outputs[0][0])
    index = np.argmax(prob)
    confidence = prob[index]

    en_name = CLASS_NAMES[index]
    th_name = CLASS_NAMES_TH.get(en_name, "ไม่ทราบชื่อโรค")

    return jsonify({
        "label": f"{en_name} ({th_name})",
        "confidence": round(float(confidence) * 100, 2)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)