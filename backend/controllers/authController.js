import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import sendEmail from '../utils/email.js';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { NotificationService } from '../services/notificationService.js';
import { UAParser } from 'ua-parser-js';
import axios from 'axios';
import { format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notificationService = new NotificationService();

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
    try {
        console.log('Registration attempt with data:', {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            displayName: req.body.displayName,
            phoneNumber: req.body.phoneNumber
        });

        const { email, password, firstName, lastName, displayName, phoneNumber } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if (!existingUser.emailVerified) {
                // Resend verification email
                const verificationCode = generateVerificationCode();
                const verificationToken = crypto.randomBytes(32).toString('hex');
                const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                existingUser.verificationCode = verificationCode;
                existingUser.verificationToken = verificationToken;
                existingUser.verificationTokenExpires = verificationTokenExpires;
                await existingUser.save();
                try {
                    const verificationLink = `http://localhost:5174/verify-email?token=${verificationToken}`;
                    await sendEmail({
                        to: email,
                        subject: 'Verify Your Email Address',
                        html: path.join('templates', 'verification-email.html'),
                        context: {
                            displayName: existingUser.displayName,
                            verificationCode,
                            verificationLink,
                            email,
                            currentYear: new Date().getFullYear()
                        }
                    });
                } catch (emailError) {
                    return res.status(500).json({
                        error: 'Failed to resend verification email',
                        details: emailError.message
                    });
                }
                return res.status(200).json({
                    message: 'Account already exists but is not verified. Verification email resent.',
                    requiresVerification: true
                });
            }
            // If email is verified, block registration
            return res.status(400).json({
                error: 'Email already registered'
            });
        }

        // Generate verification code and token
        const verificationCode = generateVerificationCode();
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        console.log('Generated verification code:', verificationCode);

        // Create user with verification code
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            displayName,
            phoneNumber,
            verificationCode,
            verificationToken,
            verificationTokenExpires,
            emailVerified: false
        });

        await user.save();

        // Send verification email
        try {
            console.log('Attempting to send verification email to:', email);
            const verificationLink = `http://localhost:5174/verify-email?token=${verificationToken}`;

            await sendEmail({
                to: email,
                subject: 'Verify Your Email Address',
                html: path.join('templates', 'verification-email.html'),
                context: {
                    displayName,
                    verificationCode,
                    verificationLink,
                    email,
                    currentYear: new Date().getFullYear()
                }
            });

            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            return res.status(500).json({
                error: 'Failed to send verification email',
                details: emailError.message
            });
        }

        res.status(201).json({
            message: 'Registration successful. Please check your email for verification.',
            requiresVerification: true
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
            return res.status(400).json({ error: 'This phone number is already registered. Please use a different number.' });
        }
        res.status(500).json({ error: 'Failed to register user' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: 'User not found'
            });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({
                message: 'Invalid verification code'
            });
        }

        // Check if code is expired (10 minutes)
        const codeAge = Date.now() - user.updatedAt;
        if (codeAge > 10 * 60 * 1000) {
            return res.status(400).json({
                message: 'Verification code has expired'
            });
        }

        // Update user
        user.emailVerified = true;
        user.verificationCode = null;
        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Email verified successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName,
                profilePicture: user.profilePicture,
                walletBalance: user.walletBalance,
                isVerified: user.kycStatus === 'verified',
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            message: 'An error occurred during verification'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Increment login attempts
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
                await user.save();

                // Send security alert for account lockout
                await notificationService.notifySecurityAlert(
                    user._id,
                    'account_locked',
                    {
                        attempts: user.loginAttempts,
                        lockUntil: user.lockUntil,
                        ip: req.ip,
                        userAgent: req.headers['user-agent']
                    }
                );

                return res.status(401).json({
                    message: 'Account locked due to multiple failed attempts. Please try again in 15 minutes.'
                });
            }
            await user.save();
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        // Reset login attempts on successful login
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        user.lastLogin = new Date();
        await user.save();

        // --- DYNAMIC SECURITY DATA ---
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const parser = new UAParser(userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = `${browser.name || 'Unknown Browser'} ${browser.version || ''} on ${os.name || 'Unknown OS'} ${os.version || ''}`.trim();
        let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '127.0.0.1';
        if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
        if (ip === '::1') ip = '127.0.0.1';
        let location = 'Unknown';
        try {
            const geo = await axios.get(`http://ip-api.com/json/${ip}`);
            if (geo.data && geo.data.status === 'success') {
                location = `${geo.data.city || ''}, ${geo.data.country || ''}`.replace(/^, /, '');
            }
        } catch (e) { }
        const timestamp = format(new Date(), 'PPpp');
        // --- END DYNAMIC SECURITY DATA ---

        // Send security alert for successful login
        await notificationService.notifySecurityAlert(
            user._id,
            'login_success',
            {
                device,
                ip,
                location,
                timestamp,
                userAgent,
                secureAccountUrl: 'https://dinarflow.com/security',
                learnMoreUrl: 'https://dinarflow.com/security/learn-more',
                supportUrl: 'https://dinarflow.com/support',
                privacyUrl: 'https://dinarflow.com/privacy',
                termsUrl: 'https://dinarflow.com/terms',
                currentYear: new Date().getFullYear()
            }
        );

        // If email is not verified, resend verification code
        if (!user.emailVerified) {
            const verificationCode = generateVerificationCode();
            user.verificationCode = verificationCode;
            user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            await user.save();

            try {
                const verificationLink = `http://localhost:5174/verify-email?token=${user.verificationToken}`;
                await sendEmail({
                    to: user.email,
                    subject: 'Verify Your Email Address',
                    html: path.join('templates', 'verification-email.html'),
                    context: {
                        displayName: user.displayName,
                        verificationCode,
                        verificationLink,
                        email: user.email,
                        currentYear: new Date().getFullYear()
                    }
                });
            } catch (emailError) {
                console.error('Error sending verification email:', emailError);
            }
        }

        // Generate token with appropriate expiration
        const tokenExpiration = rememberMe ? '30d' : '1d'; // 30 days for remember me, 1 day for normal session
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiration }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                emailVerified: user.emailVerified,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: 'New password must be different from current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        user.lastPasswordChange = new Date();
        await user.save();

        // --- DYNAMIC SECURITY DATA ---
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const parser = new UAParser(userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = `${browser.name || 'Unknown Browser'} ${browser.version || ''} on ${os.name || 'Unknown OS'} ${os.version || ''}`.trim();
        let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '127.0.0.1';
        if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
        if (ip === '::1') ip = '127.0.0.1';
        let location = 'Unknown';
        try {
            const geo = await axios.get(`http://ip-api.com/json/${ip}`);
            if (geo.data && geo.data.status === 'success') {
                location = `${geo.data.city || ''}, ${geo.data.country || ''}`.replace(/^, /, '');
            }
        } catch (e) { }
        const timestamp = format(new Date(), 'PPpp');
        // --- END DYNAMIC SECURITY DATA ---
        // Send security alert for password change
        await notificationService.notifySecurityAlert(
            user._id,
            'password_changed',
            {
                device,
                ip,
                location,
                timestamp,
                userAgent,
                secureAccountUrl: 'https://dinarflow.com/security',
                learnMoreUrl: 'https://dinarflow.com/security/learn-more',
                supportUrl: 'https://dinarflow.com/support',
                privacyUrl: 'https://dinarflow.com/privacy',
                termsUrl: 'https://dinarflow.com/terms',
                currentYear: new Date().getFullYear()
            }
        );
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const toggleTwoFactor = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const newStatus = !user.twoFactorEnabled;

        user.twoFactorEnabled = newStatus;
        await user.save();

        // --- DYNAMIC SECURITY DATA ---
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const parser = new UAParser(userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = `${browser.name || 'Unknown Browser'} ${browser.version || ''} on ${os.name || 'Unknown OS'} ${os.version || ''}`.trim();
        let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '127.0.0.1';
        if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
        if (ip === '::1') ip = '127.0.0.1';
        let location = 'Unknown';
        try {
            const geo = await axios.get(`http://ip-api.com/json/${ip}`);
            if (geo.data && geo.data.status === 'success') {
                location = `${geo.data.city || ''}, ${geo.data.country || ''}`.replace(/^, /, '');
            }
        } catch (e) { }
        const timestamp = format(new Date(), 'PPpp');
        // --- END DYNAMIC SECURITY DATA ---
        // Send security alert for 2FA change
        await notificationService.notifySecurityAlert(
            user._id,
            '2fa_changed',
            {
                enabled: newStatus,
                device,
                ip,
                location,
                timestamp,
                userAgent,
                secureAccountUrl: 'https://dinarflow.com/security',
                learnMoreUrl: 'https://dinarflow.com/security/learn-more',
                supportUrl: 'https://dinarflow.com/support',
                privacyUrl: 'https://dinarflow.com/privacy',
                termsUrl: 'https://dinarflow.com/terms',
                currentYear: new Date().getFullYear()
            }
        );
        res.json({
            message: `Two-factor authentication ${newStatus ? 'enabled' : 'disabled'} successfully`,
            twoFactorEnabled: newStatus
        });
    } catch (error) {
        console.error('Toggle 2FA error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }
        // Generate new code and token
        const verificationCode = generateVerificationCode();
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        user.verificationCode = verificationCode;
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = verificationTokenExpires;
        await user.save();
        try {
            const verificationLink = `http://localhost:5174/verify-email?token=${verificationToken}`;
            await sendEmail({
                to: email,
                subject: 'Verify Your Email Address',
                html: path.join('templates', 'verification-email.html'),
                context: {
                    displayName: user.displayName,
                    verificationCode,
                    verificationLink,
                    email,
                    currentYear: new Date().getFullYear()
                }
            });
        } catch (emailError) {
            return res.status(500).json({ error: 'Failed to resend verification email', details: emailError.message });
        }
        return res.status(200).json({ message: 'Verification code resent successfully.' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification code' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: 'No account found with this email address'
            });
        }

        // Generate reset token and code
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save reset token and code to user
        user.resetToken = resetToken;
        user.resetTokenExpires = resetTokenExpires;
        user.verificationCode = resetCode;
        await user.save();

        // Send reset email
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;
        await sendEmail({
            to: email,
            subject: 'Password Reset Instructions',
            html: path.join('templates', 'reset-password-email.html'),
            context: {
                displayName: user.displayName,
                resetLink,
                resetCode,
                email,
                currentYear: new Date().getFullYear()
            }
        });

        res.json({
            message: 'Password reset instructions sent to your email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: 'No account found with this email address'
            });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({
                message: 'Invalid verification code'
            });
        }

        // Check if code is expired (10 minutes)
        const codeAge = Date.now() - user.updatedAt;
        if (codeAge > 10 * 60 * 1000) {
            return res.status(400).json({
                message: 'Verification code has expired'
            });
        }

        res.status(200).json({
            message: 'Code verified successfully'
        });
    } catch (error) {
        console.error('Reset code verification error:', error);
        res.status(500).json({
            message: 'An error occurred during code verification'
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: 'No account found with this email address'
            });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({
                message: 'Invalid verification code'
            });
        }

        // Check if code is expired (10 minutes)
        const codeAge = Date.now() - user.updatedAt;
        if (codeAge > 10 * 60 * 1000) {
            return res.status(400).json({
                message: 'Verification code has expired'
            });
        }

        // Update password
        user.password = newPassword;
        user.verificationCode = null;
        user.resetToken = null;
        user.resetTokenExpires = null;
        await user.save();

        res.status(200).json({
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            message: 'An error occurred while resetting password'
        });
    }
};

const validateResetToken = async (req, res) => {
    try {
        const { token } = req.body;

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                valid: false,
                message: 'Invalid or expired reset token'
            });
        }

        res.json({
            valid: true,
            email: user.email
        });
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({
            valid: false,
            message: 'Error validating reset token'
        });
    }
};

const authController = {
    register,
    login,
    updatePassword,
    verifyEmail,
    resendVerification,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    toggleTwoFactor,
    validateResetToken
};

export default authController; 