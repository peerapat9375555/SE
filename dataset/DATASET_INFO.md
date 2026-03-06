# Skin Disease Classification Dataset

## Dataset Download

Download the complete dataset from Google Drive:
https://drive.google.com/file/d/1pvnaWEzrbmzI58XJawk0F8K7pzAAOS0F/view?usp=sharing

## Dataset Structure

After downloading and extracting, the dataset should have the following structure:

```
SkinDisease/
├── train_balanced/    # Balanced training data
│   ├── Acne/
│   ├── Actinic_Keratosis/
│   ├── Benign_tumors/
│   ├── Bullous/
│   ├── Candidiasis/
│   ├── DrugEruption/
│   ├── Eczema/
│   ├── Infestations_Bites/
│   ├── Lichen/
│   ├── Lupus/
│   ├── Moles/
│   ├── Psoriasis/
│   ├── Rosacea/
│   ├── Seborrh_Keratoses/
│   ├── SkinCancer/
│   ├── Sun_Sunlight_Damage/
│   ├── Tinea/
│   ├── Unknown_Normal/
│   ├── Vascular_Tumors/
│   ├── Vasculitis/
│   ├── Vitiligo/
│   └── Warts/
├── split_val/         # Validation data (same 22 classes)
└── test/              # Test data (same 22 classes)
```

## Classes (22 total)

1. Acne (สิว)
2. Actinic_Keratosis (ผื่นแดดเรื้อรัง)
3. Benign_tumors (เนื้องอกไม่ร้ายแรง)
4. Bullous (โรคผื่นพุพอง)
5. Candidiasis (โรคเชื้อราแคนดิดา)
6. DrugEruption (ผื่นจากยา)
7. Eczema (โรคผิวหนังอักเสบ)
8. Infestations_Bites (โรคจากแมลงกัดต่อย)
9. Lichen (ไลเคน)
10. Lupus (โรคลูปัส)
11. Moles (ไฝ)
12. Psoriasis (โรคสะเก็ดเงิน)
13. Rosacea (โรคโรซาเซีย)
14. Seborrh_Keratoses (ไฝแก่)
15. SkinCancer (มะเร็งผิวหนัง)
16. Sun_Sunlight_Damage (ผิวเสียจากแสงแดด)
17. Tinea (โรคกลาก)
18. Unknown_Normal (ปกติ/ไม่ทราบ)
19. Vascular_Tumors (เนื้องอกหลอดเลือด)
20. Vasculitis (โรคหลอดเลือดอักเสบ)
21. Vitiligo (โรคด่างขาว)
22. Warts (หูด)

## Usage

After downloading, update the `DATA_ROOT` path in `training_code/config.py` to point to your dataset location.
