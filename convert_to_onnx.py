"""
Convert EfficientNet-B2 model from PyTorch (.pth) to ONNX (.onnx)
Run this locally: python convert_to_onnx.py
"""
import os
os.environ["PYTHONIOENCODING"] = "utf-8"

import torch
from torchvision import models

NUM_CLASSES = 22
IMG_SIZE = 260

# Load model
model = models.efficientnet_b2()
model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, NUM_CLASSES)

checkpoint = torch.load('model/best_model.pth', map_location='cpu', weights_only=False)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

# Create dummy input
dummy_input = torch.randn(1, 3, IMG_SIZE, IMG_SIZE)

# Export to ONNX (use dynamo=False for compatibility)
torch.onnx.export(
    model,
    dummy_input,
    "model/best_model.onnx",
    export_params=True,
    opset_version=13,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    },
    dynamo=False
)

print("Model converted to ONNX: model/best_model.onnx")
