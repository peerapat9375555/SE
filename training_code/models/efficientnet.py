"""
EfficientNet model definitions for skin disease classification
"""
import torch
import torch.nn as nn
from torchvision import models


def get_efficientnet_b2(num_classes=22, pretrained=True):
    """
    Get EfficientNet-B2 model
    
    Args:
        num_classes: Number of output classes
        pretrained: Whether to use ImageNet pretrained weights
    
    Returns:
        EfficientNet-B2 model
    """
    if pretrained:
        weights = models.EfficientNet_B2_Weights.IMAGENET1K_V1
        model = models.efficientnet_b2(weights=weights)
    else:
        model = models.efficientnet_b2(weights=None)
    
    # Modify classifier for our number of classes
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    
    return model


def get_efficientnet_b3(num_classes=22, pretrained=True):
    """
    Get EfficientNet-B3 model
    
    Args:
        num_classes: Number of output classes
        pretrained: Whether to use ImageNet pretrained weights
    
    Returns:
        EfficientNet-B3 model
    """
    if pretrained:
        weights = models.EfficientNet_B3_Weights.IMAGENET1K_V1
        model = models.efficientnet_b3(weights=weights)
    else:
        model = models.efficientnet_b3(weights=None)
    
    # Modify classifier for our number of classes
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    
    return model


def get_efficientnet_b4(num_classes=22, pretrained=True):
    """
    Get EfficientNet-B4 model
    
    Args:
        num_classes: Number of output classes
        pretrained: Whether to use ImageNet pretrained weights
    
    Returns:
        EfficientNet-B4 model
    """
    if pretrained:
        weights = models.EfficientNet_B4_Weights.IMAGENET1K_V1
        model = models.efficientnet_b4(weights=weights)
    else:
        model = models.efficientnet_b4(weights=None)
    
    # Modify classifier for our number of classes
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    
    return model
