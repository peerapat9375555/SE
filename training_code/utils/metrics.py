"""
Evaluation metrics for model performance
"""
import torch
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix,
    classification_report
)


def calculate_metrics(y_true, y_pred, average='macro'):
    """
    Calculate classification metrics
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        average: Averaging method for multi-class metrics
    
    Returns:
        Dictionary of metrics
    """
    metrics = {
        'accuracy': accuracy_score(y_true, y_pred),
        'f1_macro': f1_score(y_true, y_pred, average='macro', zero_division=0),
        'f1_weighted': f1_score(y_true, y_pred, average='weighted', zero_division=0),
        'precision_macro': precision_score(y_true, y_pred, average='macro', zero_division=0),
        'precision_weighted': precision_score(y_true, y_pred, average='weighted', zero_division=0),
        'recall_macro': recall_score(y_true, y_pred, average='macro', zero_division=0),
        'recall_weighted': recall_score(y_true, y_pred, average='weighted', zero_division=0),
    }
    
    return metrics


def get_confusion_matrix(y_true, y_pred):
    """
    Calculate confusion matrix
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
    
    Returns:
        Confusion matrix
    """
    return confusion_matrix(y_true, y_pred)


def get_classification_report(y_true, y_pred, class_names):
    """
    Generate classification report
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        class_names: List of class names
    
    Returns:
        Classification report string
    """
    return classification_report(
        y_true,
        y_pred,
        target_names=class_names,
        zero_division=0
    )


def evaluate_model(model, dataloader, device, class_names):
    """
    Evaluate model on a dataset
    
    Args:
        model: PyTorch model
        dataloader: DataLoader for evaluation
        device: Device to run evaluation on
        class_names: List of class names
    
    Returns:
        Dictionary with metrics, predictions, and ground truth
    """
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []
    
    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            labels = labels.to(device)
            
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(probs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())
    
    # Calculate metrics
    metrics = calculate_metrics(all_labels, all_preds)
    cm = get_confusion_matrix(all_labels, all_preds)
    report = get_classification_report(all_labels, all_preds, class_names)
    
    return {
        'metrics': metrics,
        'confusion_matrix': cm,
        'classification_report': report,
        'predictions': np.array(all_preds),
        'labels': np.array(all_labels),
        'probabilities': np.array(all_probs)
    }
