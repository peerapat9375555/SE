"""
Data augmentation and transformation pipelines
"""
from torchvision import transforms
import config


def get_train_transforms(img_size=config.IMG_SIZE):
    """
    Get training data transforms with augmentation
    
    Args:
        img_size: Target image size
    
    Returns:
        Composed transforms for training
    """
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(
            brightness=0.2,
            contrast=0.2,
            saturation=0.2,
            hue=0.1
        ),
        transforms.RandomAffine(
            degrees=0,
            translate=(0.1, 0.1),
            scale=(0.9, 1.1)
        ),
        transforms.ToTensor(),
        transforms.Normalize(mean=config.MEAN, std=config.STD),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.15))
    ])


def get_val_transforms(img_size=config.IMG_SIZE):
    """
    Get validation/test data transforms (no augmentation)
    
    Args:
        img_size: Target image size
    
    Returns:
        Composed transforms for validation/test
    """
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=config.MEAN, std=config.STD)
    ])
