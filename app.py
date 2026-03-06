import torch
from torchvision import models, transforms
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

# 1. การตั้งค่าโมเดล
IMG_SIZE = 260
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]
NUM_CLASSES = 22

CLASS_NAMES = ["Acne", "Actinic_Keratosis", "Benign_tumors", "Bullous", "Candidiasis", "DrugEruption", "Eczema", "Infestations_Bites", "Lichen", "Lupus", "Moles", "Psoriasis", "Rosacea", "Seborrh_Keratoses", "SkinCancer", "Sun_Sunlight_Damage", "Tinea", "Unknown_Normal", "Vascular_Tumors", "Vasculitis", "Vitiligo", "Warts"]
CLASS_NAMES_TH = {"Acne": "สิว", "Actinic_Keratosis": "ผื่นแดดเรื้อรัง", "Benign_tumors": "เนื้องอกไม่ร้ายแรง", "Bullous": "โรคผื่นพุพอง", "Candidiasis": "โรคเชื้อราแคนดิดา", "DrugEruption": "ผื่นจากยา", "Eczema": "โรคผิวหนังอักเสบ", "Infestations_Bites": "โรคจากแมลงกัดต่อย", "Lichen": "ไลเคน", "Lupus": "โรคลูปัส", "Moles": "ไฝ", "Psoriasis": "โรคสะเก็ดเงิน", "Rosacea": "โรคโรซาเซีย", "Seborrh_Keratoses": "ไฝแก่", "SkinCancer": "มะเร็งผิวหนัง", "Sun_Sunlight_Damage": "ผิวเสียจากแสงแดด", "Tinea": "โรคกลาก", "Unknown_Normal": "ปกติ/ไม่ทราบ", "Vascular_Tumors": "เนื้องอกหลอดเลือด", "Vasculitis": "โรคหลอดเลือดอักเสบ", "Vitiligo": "โรคด่างขาว", "Warts": "หูด"}

# 2. โหลดโมเดล EfficientNet-B2
model = models.efficientnet_b2()
model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, NUM_CLASSES)

MODEL_PATH = 'model/best_model.pth'
if os.path.exists(MODEL_PATH):
    checkpoint = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    print("✅ Skin Classification Model Ready on Port 5000")
else:
    print(f"⚠️ Warning: ไม่พบไฟล์โมเดลที่ {MODEL_PATH}")

transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD)
])

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['file']
    img = Image.open(io.BytesIO(file.read())).convert('RGB')
    img_t = transform(img).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img_t)
        prob = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, index = torch.max(prob, 0)

    en_name = CLASS_NAMES[index.item()]
    th_name = CLASS_NAMES_TH.get(en_name, "ไม่ทราบชื่อโรค")

    return jsonify({
        "label": f"{en_name} ({th_name})",
        "confidence": round(confidence.item() * 100, 2)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)