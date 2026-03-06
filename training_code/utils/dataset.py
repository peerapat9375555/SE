"""
Dataset loader for skin disease images
"""
import torch
from torch.utils.data import DataLoader
from torchvision.datasets import ImageFolder
from collections import Counter
import numpy as np

import config
from utils.transforms import get_train_transforms, get_val_transforms


def get_dataloaders(batch_size=config.BATCH_SIZE, num_workers=config.NUM_WORKERS):
    """
    Create train, validation, and test dataloaders
    
    Args:
        batch_size: Batch size for dataloaders
        num_workers: Number of worker processes for data loading
    
    Returns:
        train_loader, val_loader, test_loader, class_weights
    """
    # Create datasets
    train_dataset = ImageFolder(
        root=str(config.TRAIN_DIR),
        transform=get_train_transforms()
    )
    
    val_dataset = ImageFolder(
        root=str(config.VAL_DIR),
        transform=get_val_transforms()
    )
    
    test_dataset = ImageFolder(
        root=str(config.TEST_DIR),
        transform=get_val_transforms()
    )
    
    # Calculate class weights for handling imbalance
    class_weights = calculate_class_weights(train_dataset)
    
    # Create dataloaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    print(f"Train samples: {len(train_dataset)}")
    print(f"Val samples: {len(val_dataset)}")
    print(f"Test samples: {len(test_dataset)}")
    print(f"Number of classes: {len(train_dataset.classes)}")
    
    return train_loader, val_loader, test_loader, class_weights


def calculate_class_weights(dataset):
    """
    Calculate inverse class frequency weights
    
    Args:
        dataset: PyTorch ImageFolder dataset
    
    Returns:
        Tensor of class weights
    """
    # Count samples per class
    class_counts = Counter(dataset.targets)
    num_samples = len(dataset)
    num_classes = len(dataset.classes)
    
    # Calculate inverse class frequency
    weights = []
    for i in range(num_classes):
        count = class_counts[i]
        weight = num_samples / (num_classes * count)
        weights.append(weight)
    
    weights = torch.tensor(weights, dtype=torch.float32)
    
    print("\nClass weights:")
    for i, (class_name, weight) in enumerate(zip(dataset.classes, weights)):
        print(f"  {class_name}: {weight:.4f} (samples: {class_counts[i]})")
    
    return weights
