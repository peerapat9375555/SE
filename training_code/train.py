"""
Main training script for skin disease classification
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.tensorboard import SummaryWriter
from pathlib import Path
import argparse
import yaml
import random
import numpy as np
from tqdm import tqdm
import time

import config
from models import get_efficientnet_b2
from utils.dataset import get_dataloaders
from utils.metrics import calculate_metrics
from utils.visualization import plot_training_history, plot_confusion_matrix
from utils.logger import setup_logger
from utils.focal_loss import FocalLoss


def set_seed(seed=42):
    """Set random seeds for reproducibility"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_model(model_name, num_classes=22, pretrained=True):
    """Get model by name"""
    models_dict = {
        'efficientnet_b2': get_efficientnet_b2,
    }
    
    if model_name not in models_dict:
        raise ValueError(f"Model {model_name} not supported. Choose from {list(models_dict.keys())}")
    
    return models_dict[model_name](num_classes=num_classes, pretrained=pretrained)


def train_one_epoch(model, dataloader, criterion, optimizer, device, epoch, logger):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    pbar = tqdm(dataloader, desc=f'Epoch {epoch} [Train]')
    for images, labels in pbar:
        images = images.to(device)
        labels = labels.to(device)
        
        # Forward pass
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        
        # Backward pass
        loss.backward()
        optimizer.step()
        
        # Track metrics
        running_loss += loss.item() * images.size(0)
        
        probs = torch.softmax(outputs, dim=1)
        _, preds = torch.max(probs, 1)
        
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
        
        # Update progress bar
        pbar.set_postfix({'loss': loss.item()})
    
    # Calculate epoch metrics
    epoch_loss = running_loss / len(dataloader.dataset)
    metrics = calculate_metrics(all_labels, all_preds)
    
    logger.info(f"Train - Loss: {epoch_loss:.4f}, Acc: {metrics['accuracy']:.4f}, F1: {metrics['f1_macro']:.4f}")
    
    return epoch_loss, metrics


def validate(model, dataloader, criterion, device, epoch, logger):
    """Validate model"""
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        pbar = tqdm(dataloader, desc=f'Epoch {epoch} [Val]')
        for images, labels in pbar:
            images = images.to(device)
            labels = labels.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item() * images.size(0)
            
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(probs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
            pbar.set_postfix({'loss': loss.item()})
    
    # Calculate epoch metrics
    epoch_loss = running_loss / len(dataloader.dataset)
    metrics = calculate_metrics(all_labels, all_preds)
    
    logger.info(f"Val   - Loss: {epoch_loss:.4f}, Acc: {metrics['accuracy']:.4f}, F1: {metrics['f1_macro']:.4f}")
    
    return epoch_loss, metrics


def train(model_name, epochs=30, batch_size=32, lr=0.001, gamma=2.0):
    """Main training function"""
    
    # Set seed
    set_seed(config.SEED)
    
    # Setup experiment directory
    exp_dir = config.EXPERIMENT_DIR / model_name
    exp_dir.mkdir(parents=True, exist_ok=True)
    
    checkpoint_dir = exp_dir / 'checkpoints'
    checkpoint_dir.mkdir(exist_ok=True)
    
    log_dir = exp_dir / 'logs'
    log_dir.mkdir(exist_ok=True)
    
    results_dir = exp_dir / 'results'
    results_dir.mkdir(exist_ok=True)
    
    # Setup logger
    logger = setup_logger(model_name, log_dir)
    logger.info(f"Starting training for {model_name}")
    logger.info(f"Experiment directory: {exp_dir}")
    
    # Setup device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {device}")
    
    # Get dataloaders
    logger.info("Loading datasets...")
    train_loader, val_loader, test_loader, class_weights = get_dataloaders(
        batch_size=batch_size,
        num_workers=config.NUM_WORKERS
    )
    
    # Create model
    logger.info(f"Creating model: {model_name}")
    model = get_model(model_name, num_classes=config.NUM_CLASSES, pretrained=True)
    model = model.to(device)
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info(f"Total parameters: {total_params:,}")
    logger.info(f"Trainable parameters: {trainable_params:,}")
    
    # Setup loss function
    criterion = FocalLoss(alpha=class_weights.to(device), gamma=gamma)
    logger.info(f"Using Focal Loss with gamma={gamma}")
    
    # Setup optimizer
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=0.0001)
    
    # Setup scheduler
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.1, patience=3
    )
    
    # Setup TensorBoard
    writer = SummaryWriter(log_dir=log_dir)
    
    # Training history
    history = {
        'train_loss': [],
        'val_loss': [],
        'train_acc': [],
        'val_acc': [],
        'train_f1': [],
        'val_f1': []
    }
    
    # Training loop
    best_f1 = 0.0
    best_loss = float('inf')
    patience_counter = 0
    
    logger.info("Starting training...")
    for epoch in range(1, epochs + 1):
        logger.info(f"\n{'='*50}")
        logger.info(f"Epoch {epoch}/{epochs}")
        logger.info(f"{'='*50}")
        
        # Train
        train_loss, train_metrics = train_one_epoch(
            model, train_loader, criterion, optimizer, device, epoch, logger
        )
        
        # Validate
        val_loss, val_metrics = validate(
            model, val_loader, criterion, device, epoch, logger
        )
        
        # Update scheduler
        scheduler.step(val_loss)
        
        # Save history
        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['train_acc'].append(train_metrics['accuracy'])
        history['val_acc'].append(val_metrics['accuracy'])
        history['train_f1'].append(train_metrics['f1_macro'])
        history['val_f1'].append(val_metrics['f1_macro'])
        
        # Log to TensorBoard
        writer.add_scalar('Loss/train', train_loss, epoch)
        writer.add_scalar('Loss/val', val_loss, epoch)
        writer.add_scalar('Accuracy/train', train_metrics['accuracy'], epoch)
        writer.add_scalar('Accuracy/val', val_metrics['accuracy'], epoch)
        writer.add_scalar('F1/train', train_metrics['f1_macro'], epoch)
        writer.add_scalar('F1/val', val_metrics['f1_macro'], epoch)
        writer.add_scalar('LR', optimizer.param_groups[0]['lr'], epoch)
        
        # Save best model
        if val_metrics['f1_macro'] > best_f1:
            best_f1 = val_metrics['f1_macro']
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'f1_macro': best_f1,
                'metrics': val_metrics
            }, checkpoint_dir / 'best_model.pth')
            logger.info(f"✓ Best model saved! F1: {best_f1:.4f}")
        
        # Early stopping
        if val_loss < best_loss:
            best_loss = val_loss
            patience_counter = 0
        else:
            patience_counter += 1
            logger.info(f"Early stopping counter: {patience_counter}/{config.EARLY_STOPPING_PATIENCE}")
            
            if patience_counter >= config.EARLY_STOPPING_PATIENCE:
                logger.info("Early stopping triggered!")
                break
    
    # Save final model
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'metrics': val_metrics
    }, checkpoint_dir / 'final_model.pth')
    
    # Plot training history
    plot_training_history(history, save_path=results_dir / 'training_history.png')
    
    # Save history
    import json
    with open(results_dir / 'history.json', 'w') as f:
        json.dump(history, f, indent=2)
    
    writer.close()
    logger.info("Training completed!")
    logger.info(f"Best F1 Score: {best_f1:.4f}")
    
    return model, history


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train skin disease classification model')
    parser.add_argument('--model', type=str, default='efficientnet_b2',
                        choices=['efficientnet_b2'],
                        help='Model architecture to train')
    parser.add_argument('--epochs', type=int, default=30, help='Number of epochs')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--gamma', type=float, default=2.0, help='Focal loss gamma')
    
    args = parser.parse_args()
    
    train(
        model_name=args.model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        gamma=args.gamma
    )
