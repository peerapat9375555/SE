"""
Visualization utilities for training and evaluation
"""
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path


def plot_training_history(history, save_path=None):
    """
    Plot training history (loss, accuracy, F1)
    
    Args:
        history: Dictionary with training history
        save_path: Path to save the plot
    """
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    
    # Plot loss
    axes[0].plot(history['train_loss'], label='Train Loss', marker='o')
    axes[0].plot(history['val_loss'], label='Val Loss', marker='s')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].set_title('Training and Validation Loss')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    # Plot accuracy
    axes[1].plot(history['train_acc'], label='Train Accuracy', marker='o')
    axes[1].plot(history['val_acc'], label='Val Accuracy', marker='s')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Accuracy')
    axes[1].set_title('Training and Validation Accuracy')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    
    # Plot F1 score
    axes[2].plot(history['train_f1'], label='Train F1 (Macro)', marker='o')
    axes[2].plot(history['val_f1'], label='Val F1 (Macro)', marker='s')
    axes[2].set_xlabel('Epoch')
    axes[2].set_ylabel('F1 Score')
    axes[2].set_title('Training and Validation F1 Score')
    axes[2].legend()
    axes[2].grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Training history plot saved to {save_path}")
    
    plt.close()


def plot_confusion_matrix(cm, class_names, save_path=None):
    """
    Plot confusion matrix heatmap
    
    Args:
        cm: Confusion matrix
        class_names: List of class names
        save_path: Path to save the plot
    """
    plt.figure(figsize=(14, 12))
    
    # Normalize confusion matrix
    cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
    
    # Create heatmap
    sns.heatmap(
        cm_normalized,
        annot=True,
        fmt='.2f',
        cmap='Blues',
        xticklabels=class_names,
        yticklabels=class_names,
        cbar_kws={'label': 'Normalized Count'}
    )
    
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.title('Confusion Matrix (Normalized)')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Confusion matrix plot saved to {save_path}")
    
    plt.close()


def plot_per_class_metrics(metrics_dict, class_names, save_path=None):
    """
    Plot per-class performance metrics
    
    Args:
        metrics_dict: Dictionary with per-class metrics
        class_names: List of class names
        save_path: Path to save the plot
    """
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    
    x = np.arange(len(class_names))
    
    # Plot precision
    axes[0].bar(x, metrics_dict['precision'], color='skyblue')
    axes[0].set_xlabel('Class')
    axes[0].set_ylabel('Precision')
    axes[0].set_title('Per-Class Precision')
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(class_names, rotation=45, ha='right')
    axes[0].grid(True, alpha=0.3, axis='y')
    
    # Plot recall
    axes[1].bar(x, metrics_dict['recall'], color='lightcoral')
    axes[1].set_xlabel('Class')
    axes[1].set_ylabel('Recall')
    axes[1].set_title('Per-Class Recall')
    axes[1].set_xticks(x)
    axes[1].set_xticklabels(class_names, rotation=45, ha='right')
    axes[1].grid(True, alpha=0.3, axis='y')
    
    # Plot F1-score
    axes[2].bar(x, metrics_dict['f1'], color='lightgreen')
    axes[2].set_xlabel('Class')
    axes[2].set_ylabel('F1-Score')
    axes[2].set_title('Per-Class F1-Score')
    axes[2].set_xticks(x)
    axes[2].set_xticklabels(class_names, rotation=45, ha='right')
    axes[2].grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Per-class metrics plot saved to {save_path}")
    
    plt.close()


def plot_model_comparison(results_df, save_path=None):
    """
    Plot comparison of different models
    
    Args:
        results_df: DataFrame with model comparison results
        save_path: Path to save the plot
    """
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    
    models = results_df['model']
    
    # Plot accuracy
    axes[0, 0].bar(models, results_df['accuracy'], color='skyblue')
    axes[0, 0].set_ylabel('Accuracy')
    axes[0, 0].set_title('Model Accuracy Comparison')
    axes[0, 0].tick_params(axis='x', rotation=45)
    axes[0, 0].grid(True, alpha=0.3, axis='y')
    
    # Plot F1 macro
    axes[0, 1].bar(models, results_df['f1_macro'], color='lightcoral')
    axes[0, 1].set_ylabel('F1 Score (Macro)')
    axes[0, 1].set_title('Model F1 Score Comparison')
    axes[0, 1].tick_params(axis='x', rotation=45)
    axes[0, 1].grid(True, alpha=0.3, axis='y')
    
    # Plot parameters
    axes[1, 0].bar(models, results_df['params_millions'], color='lightgreen')
    axes[1, 0].set_ylabel('Parameters (Millions)')
    axes[1, 0].set_title('Model Size Comparison')
    axes[1, 0].tick_params(axis='x', rotation=45)
    axes[1, 0].grid(True, alpha=0.3, axis='y')
    
    # Plot inference time
    axes[1, 1].bar(models, results_df['inference_time_ms'], color='plum')
    axes[1, 1].set_ylabel('Inference Time (ms)')
    axes[1, 1].set_title('Model Inference Speed Comparison')
    axes[1, 1].tick_params(axis='x', rotation=45)
    axes[1, 1].grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Model comparison plot saved to {save_path}")
    
    plt.close()
