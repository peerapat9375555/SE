"""
Focal Loss implementation for handling class imbalance
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


class FocalLoss(nn.Module):
    """
    Focal Loss for addressing class imbalance
    
    Reference: https://arxiv.org/abs/1708.02002
    """
    
    def __init__(self, alpha=None, gamma=2.0, reduction='mean'):
        """
        Args:
            alpha: Class weights (tensor or None)
            gamma: Focusing parameter (default: 2.0)
            reduction: 'none', 'mean', or 'sum'
        """
        super(FocalLoss, self).__init__()
        self.gamma = gamma
        self.reduction = reduction
        
        if isinstance(alpha, (list, tuple)):
            self.alpha = torch.tensor(alpha, dtype=torch.float32)
        else:
            self.alpha = alpha
    
    def forward(self, inputs, targets):
        """
        Args:
            inputs: Model predictions (logits)
            targets: Ground truth labels
        
        Returns:
            Focal loss value
        """
        # Calculate cross entropy loss
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        
        # Calculate pt (probability of true class)
        pt = torch.exp(-ce_loss)
        
        # Calculate focal loss
        focal_loss = ((1 - pt) ** self.gamma) * ce_loss
        
        # Apply class weights if provided
        if self.alpha is not None:
            if self.alpha.device != inputs.device:
                self.alpha = self.alpha.to(inputs.device)
            
            alpha_t = self.alpha[targets]
            focal_loss = alpha_t * focal_loss
        
        # Apply reduction
        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        else:
            return focal_loss
