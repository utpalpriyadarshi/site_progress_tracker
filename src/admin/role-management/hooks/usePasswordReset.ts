import { useState } from 'react';
import UserModel from '../../../../models/UserModel';
import PasswordResetService from '../../../services/PasswordResetService';
import { validatePasswordStrength } from '../../../../utils/passwordValidator';
import { logger } from '../../../services/LoggingService';

interface UsePasswordResetProps {
  currentUserId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const usePasswordReset = ({
  currentUserId,
  onSuccess,
  onError,
}: UsePasswordResetProps) => {
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [userToReset, setUserToReset] = useState<UserModel | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  const openResetPasswordDialog = (user: UserModel) => {
    setUserToReset(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowResetPasswordDialog(true);
  };

  const closeResetPasswordDialog = () => {
    setShowResetPasswordDialog(false);
    setUserToReset(null);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      onError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      onError(`Password validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    setResetPasswordLoading(true);

    try {
      const result = await PasswordResetService.resetPasswordByAdmin(
        userToReset.id,
        newPassword,
        currentUserId
      );

      if (result.success) {
        onSuccess(`Password reset successful for ${userToReset.username}`);
        closeResetPasswordDialog();
      } else {
        onError(result.details || result.error || 'Failed to reset password');
      }
    } catch (error) {
      logger.error('Error resetting password:', error);
      onError('Failed to reset password');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return {
    showResetPasswordDialog,
    userToReset,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    resetPasswordLoading,
    openResetPasswordDialog,
    closeResetPasswordDialog,
    handleResetPassword,
  };
};
