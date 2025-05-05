import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Lottie from 'lottie-react';
import successAnimation from '../../assets/animations/success.json';

const EmailVerification = () => {
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { verifyEmail, resendVerificationCode } = useAuth();

    useEffect(() => {
        // Get email from localStorage
        const pendingEmail = localStorage.getItem('pendingVerificationEmail');
        if (!pendingEmail) {
            toast.error('No pending verification found');
            navigate('/register');
            return;
        }
        setEmail(pendingEmail);
    }, [navigate]);

    // Check for verification token in URL
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            handleTokenVerification(token);
        }
    }, [searchParams]);

    const handleTokenVerification = async (token) => {
        setIsLoading(true);
        try {
            await verifyEmail(email, token);
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            toast.error(error.message || 'Failed to verify email');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!verificationCode) {
            toast.error('Please enter the verification code');
            return;
        }

        setIsLoading(true);
        try {
            await verifyEmail(email, verificationCode);
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            toast.error(error.message || 'Failed to verify email');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        try {
            await resendVerificationCode(email);
            toast.success('Verification code resent successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to resend verification code');
        } finally {
            setIsResending(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <Lottie
                            animationData={successAnimation}
                            loop={false}
                            className="w-32 h-32 mx-auto"
                        />
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            Email Verified Successfully!
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Redirecting to login page...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!email) {
        return null; // Don't render anything while checking email
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Verify Your Email
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        We sent a verification code to {email}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                        You can either enter the code below or click the link in your email
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="verification-code" className="sr-only">
                                Verification Code
                            </label>
                            <input
                                id="verification-code"
                                name="verification-code"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Enter verification code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={isResending}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                            {isResending ? 'Resending...' : "Didn't receive the code? Resend"}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.setItem('restoreRegisterForm', '1');
                                navigate('/register');
                            }}
                            className="text-sm text-gray-600 hover:text-indigo-600 underline"
                        >
                            &larr; Back to Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailVerification; 