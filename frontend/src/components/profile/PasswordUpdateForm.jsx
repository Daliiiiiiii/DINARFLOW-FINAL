import { useState } from 'react';
import { RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { h3 } from '../ui/typography';

export const PasswordUpdateForm = () => {
  const { updatePassword } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    if (!checks.length) {
      return 'Password must be at least 8 characters long';
    }
    if (!checks.uppercase) {
      return 'Password must include at least one uppercase letter';
    }
    if (!checks.lowercase) {
      return 'Password must include at least one lowercase letter';
    }
    if (!checks.number) {
      return 'Password must include at least one number';
    }
    if (!checks.special) {
      return 'Password must include at least one special character (@$!%*?&)';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation checks
    let newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Please enter your current password';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Please enter a new password';
    } else {
      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        newErrors.newPassword = passwordError;
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'The passwords you entered do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await updatePassword(formData.currentPassword, formData.newPassword);
      showNotification('success', response.message || 'Your password has been successfully updated!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message;
      const errorCode = error.response?.data?.code;
      
      switch (errorCode) {
        case 'INVALID_CURRENT_PASSWORD':
          setErrors({ 
            currentPassword: 'Wrong password! The current password you entered does not match your account password.' 
          });
          break;
        case 'SAME_PASSWORD':
          setErrors({ 
            newPassword: 'You cannot use your current password as your new password. Please choose a different password.' 
          });
          break;
        case 'USER_NOT_FOUND':
          showNotification('error', 'Unable to verify your account. Please try logging in again.');
          break;
        default:
          showNotification('error', errorMessage || 'Sorry, we couldn\'t update your password. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <RiLockLine className="text-2xl text-primary dark:text-primary-light" />
        <h3 className={h3}>Update Your Password</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <Input
            type={showCurrentPassword ? "text" : "password"}
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Enter your current password"
            icon={<RiLockLine />}
            error={errors.currentPassword}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
              >
                {showCurrentPassword ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            }
          />

          <Input
            type={showNewPassword ? "text" : "password"}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter your new password"
            icon={<RiLockLine />}
            error={errors.newPassword}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              >
                {showNewPassword ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            }
          />

          <Input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your new password"
            icon={<RiLockLine />}
            error={errors.confirmPassword}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
              >
                {showConfirmPassword ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            }
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loading}
        >
          Update Password
        </Button>
      </form>
    </Card>
  );
}; 