import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { 
    RiMailLine, RiLockLine, RiUserLine, RiPhoneLine, 
    RiEyeLine, RiEyeOffLine, RiCheckLine, RiCloseLine, 
    RiRefreshLine, RiCheckboxCircleLine, RiCheckboxBlankCircleLine,
    RiFileCopyLine, RiShieldCheckLine, RiErrorWarningLine
} from 'react-icons/ri'

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        phone: ''
    })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState(0)
    const [inputStatus, setInputStatus] = useState({
        email: false,
        password: false,
        confirmPassword: false,
        displayName: false,
        phone: false
    })
    const [emailSuggestions, setEmailSuggestions] = useState([])
    const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
    const [isEmailAvailable, setIsEmailAvailable] = useState(null)
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false
    })
    const [registrationProgress, setRegistrationProgress] = useState(0)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const emailInputRef = useRef(null)
    const navigate = useNavigate()
    const { signup } = useAuth()

    // Calculate registration progress
    useEffect(() => {
        let progress = 0
        if (formData.displayName && inputStatus.displayName) progress += 20
        if (formData.email && inputStatus.email) progress += 20
        if (formData.phone && inputStatus.phone) progress += 20
        if (formData.password && inputStatus.password) progress += 20
        if (acceptedTerms) progress += 20
        setRegistrationProgress(progress)
    }, [formData, inputStatus, acceptedTerms])

    // Password strength calculation based on requirements grid
    const getPasswordStrength = (password) => {
        let strength = 0
        if (password.length >= 8) strength++
        if (/[A-Z]/.test(password)) strength++
        if (/[a-z]/.test(password)) strength++
        if (/[0-9]/.test(password)) strength++
        return strength
    }

    useEffect(() => {
        const password = formData.password
        setPasswordRequirements({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password)
        })
        setPasswordStrength(getPasswordStrength(password))
    }, [formData.password])

    // Fix confirm password match logic
    useEffect(() => {
        setInputStatus(prev => ({
            ...prev,
            confirmPassword: formData.confirmPassword === formData.password && formData.confirmPassword.length > 0
        }))
    }, [formData.password, formData.confirmPassword])

    // Improved password generator: always includes at least one number, one uppercase, one lowercase, and one special character
    const generateStrongPassword = () => {
        const length = 12;
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        const specials = "!@#$%^&*";
        const all = lower + upper + numbers + specials;
        let password = '';
        // Ensure at least one of each
        password += lower[Math.floor(Math.random() * lower.length)];
        password += upper[Math.floor(Math.random() * upper.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += specials[Math.floor(Math.random() * specials.length)];
        for (let i = 4; i < length; i++) {
            password += all[Math.floor(Math.random() * all.length)];
        }
        // Shuffle password
        password = password.split('').sort(() => 0.5 - Math.random()).join('');
        setFormData(prev => ({
            ...prev,
            password,
            confirmPassword: password
        }));
        setShowPassword(true);
        setShowConfirmPassword(true);
    }

    const calculatePasswordStrength = (password) => {
        let strength = 0
        if (password.length >= 8) strength += 1
        if (/[A-Z]/.test(password)) strength += 1
        if (/[0-9]/.test(password)) strength += 1
        if (/[!@#$%^&*]/.test(password)) strength += 1
        setPasswordStrength(strength)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        let newValue = value

        // Input validation based on field type
        switch (name) {
            case 'displayName':
                // Only allow letters and spaces, max 50 chars, cannot start with space
                newValue = value.replace(/[^a-zA-Z\s]/g, '').replace(/^\s+/, '').slice(0, 50)
                break
            case 'email':
                // Cannot start with space
                newValue = value.replace(/^\s+/, '')
                break
            case 'phone':
                // Only allow numbers after +216, max 8 digits
                newValue = '+216' + value.replace(/[^0-9]/g, '').slice(0, 8)
                break
            case 'password':
                calculatePasswordStrength(value)
                break
        }

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }))

        // Update input status
        validateInput(name, newValue)
    }

    const validateInput = (name, value) => {
        let isValid = false
        switch (name) {
            case 'email':
                isValid = /\S+@\S+\.\S+/.test(value) && !/\s/.test(value)
                break
            case 'password':
                isValid = value.length >= 6
                break
            case 'displayName':
                isValid = value.trim().length >= 6 && value.length <= 50
                break
            case 'phone':
                isValid = value.length === 12 // +216 + 8 digits
                break
        }
        setInputStatus(prev => ({
            ...prev,
            [name]: isValid
        }))
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.email) newErrors.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(formData.email) || /\s/.test(formData.email)) newErrors.email = 'Email is invalid or contains spaces'
        
        if (!formData.password) newErrors.password = 'Password is required'
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }
        
        if (!formData.displayName) newErrors.displayName = 'Full name is required'
        else if (formData.displayName.trim().length < 6) newErrors.displayName = 'Full name must be at least 6 non-space characters'
        else if (formData.displayName.length > 50) newErrors.displayName = 'Full name must be at most 50 characters'
        
        if (!formData.phone) newErrors.phone = 'Phone number is required'
        else if (formData.phone.length !== 12) newErrors.phone = 'Phone number must be 8 digits'
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleEmailChange = (e) => {
        const value = e.target.value
        handleChange(e)
        
        // Generate email suggestions
        if (value.includes('@')) {
            const [username, domain] = value.split('@')
            if (username && !domain) {
                const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
                setEmailSuggestions(commonDomains.map(d => `${username}@${d}`))
                setShowEmailSuggestions(true)
            } else {
                setShowEmailSuggestions(false)
            }
        } else {
            setShowEmailSuggestions(false)
        }
    }

    const checkEmailAvailability = async () => {
        if (!formData.email || !inputStatus.email) return
        
        setIsEmailAvailable(null)
        try {
            const response = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            })
            
            const data = await response.json()
            setIsEmailAvailable(data.available)
            
            if (data.available) {
                toast.success('Email is available!')
            } else {
                toast.error('Email is already taken')
            }
        } catch (error) {
            console.error('Error checking email availability:', error)
            toast.error('Failed to check email availability')
        }
    }

    const verifyEmail = async () => {
        if (!formData.email || !inputStatus.email) return
        
        setIsVerifyingEmail(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success('Verification email sent!')
        } catch (error) {
            toast.error('Failed to send verification email')
        } finally {
            setIsVerifyingEmail(false)
        }
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(formData.password)
            toast.success('Password copied to clipboard!')
        } catch (error) {
            toast.error('Failed to copy password')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            const result = await signup(
                formData.email,
                formData.password,
                formData.displayName,
                formData.phone
            )

            if (result.requiresVerification) {
                localStorage.setItem('pendingVerificationEmail', formData.email)
                navigate('/verify-email')
                return
            }

            navigate('/login')
        } catch (error) {
            console.error('Registration error:', error)
            toast.error(error.message || 'Failed to register')
        } finally {
            setIsLoading(false)
        }
    }

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 0: return 'bg-red-500'
            case 1: return 'bg-red-500'
            case 2: return 'bg-yellow-500'
            case 3: return 'bg-blue-500'
            case 4: return 'bg-green-500'
            default: return 'bg-gray-200'
        }
    }

    // Email validation helper
    const isEmailFormatValid = (email) => /\S+@\S+\.\S+/.test(email)

    // Restore form data only if coming back from verification page
    useEffect(() => {
        if (localStorage.getItem('restoreRegisterForm') === '1') {
            const saved = localStorage.getItem('registerFormData');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setFormData(parsed);
                } catch {}
            }
            localStorage.removeItem('restoreRegisterForm');
        }
    }, []);

    // Save form data to localStorage on change
    useEffect(() => {
        localStorage.setItem('registerFormData', JSON.stringify(formData));
    }, [formData]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl"
            >
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-white">DF</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                    <p className="text-gray-600">Join DinarFlow today</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                        className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${registrationProgress}%` }}
                    />
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <RiUserLine className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="displayName"
                                    name="displayName"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    className={`block w-full pl-10 pr-10 py-2 border ${
                                        errors.displayName ? 'border-red-500' : inputStatus.displayName ? 'border-green-300' : 'border-gray-300'
                                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                                    placeholder="Your full name"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                />
                            </div>
                            {errors.displayName && (
                                <p className="mt-1 text-xs text-red-500">{errors.displayName}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <RiMailLine className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    ref={emailInputRef}
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className={`block w-full pl-10 pr-16 py-2 border ${
                                        errors.email ? 'border-red-500' : inputStatus.email ? 'border-green-300' : 'border-gray-300'
                                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                                    placeholder="Your email"
                                    value={formData.email}
                                    onChange={handleEmailChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    {formData.email && isEmailFormatValid(formData.email) && !/\s/.test(formData.email) ? (
                                        <button
                                            type="button"
                                            onClick={checkEmailAvailability}
                                            className="text-primary-600 hover:text-primary-700"
                                            title="Check availability"
                                        >
                                            {isEmailAvailable === null ? (
                                                <RiShieldCheckLine className="h-5 w-5" />
                                            ) : isEmailAvailable ? (
                                                <RiCheckLine className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <RiCloseLine className="h-5 w-5 text-red-500" />
                                            )}
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                            {formData.email && /\s/.test(formData.email) && (
                                <p className="mt-1 text-xs text-red-500">Email cannot contain spaces.</p>
                            )}
                            {!isEmailFormatValid(formData.email) && formData.email && !/\s/.test(formData.email) && (
                                <p className="mt-1 text-xs text-red-500">Please enter a valid email address.</p>
                            )}
                            {showEmailSuggestions && (
                                <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    {emailSuggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, email: suggestion }))
                                                setShowEmailSuggestions(false)
                                            }}
                                        >
                                            {suggestion}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <div className="relative flex">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm select-none">
                                    <RiPhoneLine className="h-5 w-5 mr-1" />+216
                                </span>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    required
                                    className={`block w-full rounded-r-lg py-2 pr-10 pl-3 border ${
                                        errors.phone ? 'border-red-500' : inputStatus.phone ? 'border-green-300' : 'border-gray-300'
                                    } shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                                    placeholder="12345678"
                                    value={formData.phone.replace('+216', '')}
                                    onChange={handleChange}
                                    maxLength={8}
                                    style={{ minWidth: '0' }}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    {inputStatus.phone ? (
                                        <div className="flex items-center space-x-1">
                                            <RiCheckLine className="h-5 w-5 text-green-500" />
                                            <span className="text-xs text-green-500">Valid</span>
                                        </div>
                                    ) : formData.phone ? (
                                        <div className="flex items-center space-x-1">
                                            <RiErrorWarningLine className="h-5 w-5 text-yellow-500" />
                                            <span className="text-xs text-yellow-500">8 digits required</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <RiLockLine className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    className={`block w-full pl-10 pr-20 py-2 border ${
                                        errors.password ? 'border-red-500' : inputStatus.password ? 'border-green-300' : 'border-gray-300'
                                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                                    placeholder="Your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-8 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <RiEyeOffLine className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <RiEyeLine className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={generateStrongPassword}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    title="Generate strong password"
                                >
                                    <RiRefreshLine className="h-5 w-5 text-gray-400 hover:text-primary-500" />
                                </button>
                            </div>
                            <div className="mt-2">
                                <div className="flex space-x-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full ${
                                                level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div className="flex items-center space-x-2">
                                        {passwordRequirements.length ? (
                                            <RiCheckboxCircleLine className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <RiCheckboxBlankCircleLine className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span className="text-xs text-gray-600">8+ characters</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {passwordRequirements.uppercase ? (
                                            <RiCheckboxCircleLine className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <RiCheckboxBlankCircleLine className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span className="text-xs text-gray-600">Uppercase letter</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {passwordRequirements.lowercase ? (
                                            <RiCheckboxCircleLine className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <RiCheckboxBlankCircleLine className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span className="text-xs text-gray-600">Lowercase letter</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {passwordRequirements.number ? (
                                            <RiCheckboxCircleLine className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <RiCheckboxBlankCircleLine className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span className="text-xs text-gray-600">Number</span>
                                    </div>
                                </div>
                                {formData.password && (
                                    <button
                                        type="button"
                                        onClick={copyToClipboard}
                                        className="mt-2 flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
                                    >
                                        <RiFileCopyLine className="h-4 w-4" />
                                        <span>Copy to clipboard</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <RiLockLine className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    className={`block w-full pl-10 pr-20 py-2 border ${
                                        errors.confirmPassword ? 'border-red-500' : inputStatus.confirmPassword ? 'border-green-300' : 'border-gray-300'
                                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    {inputStatus.confirmPassword ? (
                                        <div className="flex items-center space-x-1 whitespace-nowrap bg-white px-2 rounded">
                                            <RiCheckLine className="h-5 w-5 text-green-500" />
                                            <span className="text-xs text-green-500">Match</span>
                                        </div>
                                    ) : formData.confirmPassword ? (
                                        <div className="flex items-center space-x-1 whitespace-nowrap bg-white px-2 rounded">
                                            <RiErrorWarningLine className="h-5 w-5 text-yellow-500" />
                                            <span className="text-xs text-yellow-500">No match</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600">
                                I agree to the{' '}
                                <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                                    Terms and Conditions
                                </Link>
                            </label>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || !acceptedTerms}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Creating account...
                                </div>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

export default Register 