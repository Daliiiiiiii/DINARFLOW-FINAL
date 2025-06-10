import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Lottie from 'lottie-react';
import { RiArrowLeftLine } from 'react-icons/ri';
import successAnimation from '../../assets/animations/success.json';

const EmailVerification = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');
    const [isFromLogin, setIsFromLogin] = useState(false);
    const navigate = useNavigate();

    const { verifyEmail, resendVerificationCode } = useAuth();

    const DEMO_CODE = '123456';

    useEffect(() => {
        // Get email from localStorage
        const pendingEmail = localStorage.getItem('pendingVerificationEmail');
        const fromLogin = localStorage.getItem('verificationFromLogin');
        if (!pendingEmail) {
            toast.error('No pending verification found');
            navigate('/register');
            return;
        }
        setEmail(pendingEmail);
        setIsFromLogin(fromLogin === 'true');
    }, [navigate]);

    useEffect(() => {
        document.getElementById('code-0')?.focus();
    }, []);

    const handleChange = (index, value) => {
        if (value.length > 1) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');
        if (value && index < 5) {
            document.getElementById(`code-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const newCode = [...code];
            newCode[index - 1] = '';
            setCode(newCode);
            document.getElementById(`code-${index - 1}`)?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < pastedData.length; i++) {
            if (/\d/.test(pastedData[i])) {
                newCode[i] = pastedData[i];
            }
        }
        setCode(newCode);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const enteredCode = code.join('');
        if (enteredCode.length !== 6) {
            setError('Please enter all digits');
            return;
        }
        setIsVerifying(true);
        setError('');
        await new Promise(resolve => setTimeout(resolve, 1500));
        try {
            await verifyEmail(email, enteredCode);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            toast.error(error.message || 'Failed to verify email');
            setError('Invalid verification code');
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        setIsVerifying(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsVerifying(false);
        setError('A new verification code has been sent to your email');
        await resendVerificationCode(email);
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 text-center max-w-md w-full"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white via-green-100 to-green-200 bg-clip-text text-transparent">
                        Email Verified!
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Your email has been successfully verified. Redirecting to login...
                    </p>
                </motion.div>
            </div>
        );
    }

    if (!email) {
        return null; // Don't render anything while checking email
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-purple-500/20 to-transparent blur-3xl" />
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative"
            >
                <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700">
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ y: 10 }}
                            animate={{ y: [-10, 10] }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                            className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <Mail className="w-10 h-10 text-blue-400" />
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                            Verify Your Email
                        </h2>
                        <p className="text-gray-400">
                            We've sent a verification code to your email address. Enter the code below to verify your account.
                        </p>
                    </div>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                                error.includes('sent') ? 'bg-blue-900/20' : 'bg-red-900/20'
                            }`}
                        >
                            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                                error.includes('sent') ? 'text-blue-400' : 'text-red-400'
                            }`} />
                            <p className={error.includes('sent') ? 'text-blue-400' : 'text-red-400'}>
                                {error}
                            </p>
                        </motion.div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-between gap-2">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`code-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-14 text-center text-2xl font-bold bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all relative group overflow-hidden flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span className="relative z-10">Verify Email</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                        </button>
                    </form>
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={isVerifying}
                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            {isVerifying ? 'Resending...' : "Didn't receive the code? Resend"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('pendingVerificationEmail');
                                localStorage.removeItem('verificationFromLogin');
                                if (isFromLogin) {
                                    navigate('/login');
                                } else {
                                    localStorage.setItem('restoreRegisterForm', '1');
                                    navigate('/register');
                                }
                            }}
                            className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
                        >
                            <RiArrowLeftLine className="w-4 h-4 mr-1" />
                            {isFromLogin ? 'Back to Login' : 'Back to Register'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default EmailVerification; 