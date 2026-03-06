"""
Global configuration for Skin Disease Classification Training Project
"""
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent
DATA_ROOT = Path(r"C:\Users\tonkla\Downloads\SkinDisease\SkinDisease")

# Dataset directories
TRAIN_DIR = DATA_ROOT / "train_balanced"
VAL_DIR = DATA_ROOT / "split_val"
TEST_DIR = DATA_ROOT / "test"

# Experiment directory
EXPERIMENT_DIR = BASE_DIR / "experiments"
EXPERIMENT_DIR.mkdir(exist_ok=True)

# Image settings
IMG_SIZE = 260
MEAN = [0.485, 0.456, 0.406]  # ImageNet normalization
STD = [0.229, 0.224, 0.225]

# Training settings
BATCH_SIZE = 32
NUM_WORKERS = 4
NUM_CLASSES = 22
EPOCHS = 30
SEED = 42

# Class names (matching folder structure)
CLASS_NAMES = [
    "Acne",
    "Actinic_Keratosis",
    "Benign_tumors",
    "Bullous",
    "Candidiasis",
    "DrugEruption",
    "Eczema",
    "Infestations_Bites",
    "Lichen",
    "Lupus",
    "Moles",
    "Psoriasis",
    "Rosacea",
    "Seborrh_Keratoses",
    "SkinCancer",
    "Sun_Sunlight_Damage",
    "Tinea",
    "Unknown_Normal",
    "Vascular_Tumors",
    "Vasculitis",
    "Vitiligo",
    "Warts"
]

# Thai translations
CLASS_NAMES_TH = {
    "Acne": "สิว",
    "Actinic_Keratosis": "ผื่นแดดเรื้อรัง",
    "Benign_tumors": "เนื้องอกไม่ร้ายแรง",
    "Bullous": "โรคผื่นพุพอง",
    "Candidiasis": "โรคเชื้อราแคนดิดา",
    "DrugEruption": "ผื่นจากยา",
    "Eczema": "โรคผิวหนังอักเสบ",
    "Infestations_Bites": "โรคจากแมลงกัดต่อย",
    "Lichen": "ไลเคน",
    "Lupus": "โรคลูปัส",
    "Moles": "ไฝ",
    "Psoriasis": "โรคสะเก็ดเงิน",
    "Rosacea": "โรคโรซาเซีย",
    "Seborrh_Keratoses": "ไฝแก่",
    "SkinCancer": "มะเร็งผิวหนัง",
    "Sun_Sunlight_Damage": "ผิวเสียจากแสงแดด",
    "Tinea": "โรคกลาก",
    "Unknown_Normal": "ปกติ/ไม่ทราบ",
    "Vascular_Tumors": "เนื้องอกหลอดเลือด",
    "Vasculitis": "โรคหลอดเลือดอักเสบ",
    "Vitiligo": "โรคด่างขาว",
    "Warts": "หูด"
}

# Device configuration
DEVICE = "cuda"  # Will be set dynamically in training script

# Early stopping
EARLY_STOPPING_PATIENCE = 5

# Model checkpointing
SAVE_BEST_ONLY = True
MONITOR_METRIC = "f1_macro"  # Options: 'f1_macro', 'accuracy', 'loss'
