import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import sendEmail from '../utils/email.js';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
    try {
        console.log('Registration attempt with data:', {
            email: req.body.email,
            displayName: req.body.displayName,
            phoneNumber: req.body.phoneNumber
        });

        const { email, password, displayName, phoneNumber } = req.body;

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
                    const verificationLink = `http://localhost:5173/verify-email?token=${verificationToken}`;
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
            const verificationLink = `http://localhost:5173/verify-email?token=${verificationToken}`;

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
                displayName: user.displayName,
                phoneNumber: user.phoneNumber,
                walletBalance: user.walletBalance,
                cryptoBalance: user.cryptoBalance,
                kycVerified: user.kycVerified,
                kycStatus: user.kycStatus,
                emailVerified: user.emailVerified,
                profilePicture: user.profilePicture
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
            return res.status(401).json({
                message: 'Invalid credentials'
            });
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
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                phoneNumber: user.phoneNumber,
                walletBalance: user.walletBalance,
                cryptoBalance: user.cryptoBalance,
                kycVerified: user.kycVerified,
                kycStatus: user.kycStatus,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            });
        }

        // Get user from database
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(400).json({
                message: 'Unable to find your account. Please try again.'
            });
        }

        // Check if current password matches
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                message: 'New password must be different from your current password'
            });
        }

        // Update password
        user.password = newPassword; // The model middleware will hash it
        await user.save();

        res.status(200).json({
            message: 'Your password has been successfully updated!'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
            message: 'An error occurred while updating your password. Please try again.'
        });
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
            const verificationLink = `http://localhost:5173/verify-email?token=${verificationToken}`;
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

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        // Save reset token to user
        user.resetToken = resetToken;
        user.resetTokenExpires = resetTokenExpires;
        await user.save();

        // Send reset email
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        await sendEmail({
            to: email,
            subject: 'Password Reset Instructions',
            html: path.join('templates', 'reset-password-email.html'),
            context: {
                displayName: user.displayName,
                resetLink,
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

const authController = {
    register,
    login,
    updatePassword,
    verifyEmail,
    resendVerification,
    forgotPassword
};

export default authController; 