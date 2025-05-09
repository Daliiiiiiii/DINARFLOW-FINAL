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
import Logo from '../ui/Logo'
import api from '../../lib/axios'

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
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
        firstName: false,
        lastName: false,
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
        if (formData.firstName && inputStatus.firstName) progress += 10
        if (formData.lastName && inputStatus.lastName) progress += 10
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
            case 'firstName':
            case 'lastName':
                // Only allow letters and spaces, max 25 chars, cannot start with space
                newValue = value.replace(/[^a-zA-Z\s]/g, '').replace(/^\s+/, '').slice(0, 25)
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
            case 'firstName':
            case 'lastName':
                isValid = value.trim().length >= 2 && value.length <= 25
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

        if (!formData.firstName) newErrors.firstName = 'First name is required'
        else if (formData.firstName.trim().length < 2) newErrors.firstName = 'First name must be at least 2 characters'
        else if (formData.firstName.length > 25) newErrors.firstName = 'First name must be at most 25 characters'

        if (!formData.lastName) newErrors.lastName = 'Last name is required'
        else if (formData.lastName.trim().length < 2) newErrors.lastName = 'Last name must be at least 2 characters'
        else if (formData.lastName.length > 25) newErrors.lastName = 'Last name must be at most 25 characters'

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
            const { data } = await api.post('/api/auth/check-email', { email: formData.email })
            setIsEmailAvailable(data.available)

            if (data.available) {
                toast.success('Email is available!')
            } else {
                toast.error('Email is already taken')
            }
        } catch (error) {
            console.error('Error checking email availability:', error)
            toast.error(error.response?.data?.error || 'Failed to check email availability')
        }
    }

    const verifyEmail = async () => {
        if (!formData.email || !inputStatus.email) return

        setIsVerifyingEmail(true)
        try {
            await api.post('/api/auth/send-verification', { email: formData.email })
            toast.success('Verification email sent!')
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send verification email')
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
        if (!acceptedTerms) {
            toast.error('Please accept the terms and conditions')
            return
        }

        setIsLoading(true)
        try {
            const result = await signup(
                formData.email,
                formData.password,
                formData.firstName,
                formData.lastName,
                `${formData.firstName} ${formData.lastName}`,
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
                } catch { }
            }
            localStorage.removeItem('restoreRegisterForm');
        }
    }, []);

    // Save form data to localStorage on change
    useEffect(() => {
        localStorage.setItem('registerFormData', JSON.stringify(formData));
    }, [formData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-red-500/20 to-transparent blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.1, 1, 1.1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-purple-500/20 to-transparent blur-3xl"
                />
            </div>
            <div className="w-full max-w-md relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700"
                >
                    <div className="text-center mb-8">
                        <Logo />
                        <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-white via-red-100 to-red-200 bg-clip-text text-transparent">
                            Create Account
                        </h2>
                        <p className="mt-2 text-gray-400">
                            Join DinarFlow and start your journey
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${registrationProgress}%` }}
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            {/* First Name */}
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                                    First Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <RiUserLine className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        autoComplete="given-name"
                                        required
                                        className={`block w-full pl-10 pr-10 py-2 border ${errors.firstName ? 'border-red-500' : inputStatus.firstName ? 'border-green-300' : 'border-gray-700'
                                            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/50 text-gray-100`}
                                        placeholder="Your first name"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.firstName && (
                                    <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                                    Last Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <RiUserLine className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        autoComplete="family-name"
                                        required
                                        className={`block w-full pl-10 pr-10 py-2 border ${errors.lastName ? 'border-red-500' : inputStatus.lastName ? 'border-green-300' : 'border-gray-700'
                                            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/50 text-gray-100`}
                                        placeholder="Your last name"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.lastName && (
                                    <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
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
                                        className={`block w-full pl-10 pr-16 py-2 border ${errors.email ? 'border-red-500' : inputStatus.email ? 'border-green-300' : 'border-gray-700'
                                            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/50 text-gray-100`}
                                        placeholder="Your email"
                                        value={formData.email}
                                        onChange={handleEmailChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        {formData.email && isEmailFormatValid(formData.email) && !/\s/.test(formData.email) ? (
                                            <button
                                                type="button"
                                                onClick={checkEmailAvailability}
                                                className="text-blue-400 hover:text-blue-300"
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
                                    <div className="mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
                                        {emailSuggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-gray-100"
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
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                                    Phone Number
                                </label>
                                <div className="relative flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-700 bg-gray-900 text-gray-400 text-sm select-none">
                                        <RiPhoneLine className="h-5 w-5 mr-1" />+216
                                    </span>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        className={`block w-full rounded-r-lg py-2 pr-10 pl-3 border ${errors.phone ? 'border-red-500' : inputStatus.phone ? 'border-green-300' : 'border-gray-700'
                                            } shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/50 text-gray-100`}
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

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
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
                                        className={`block w-full pl-10 pr-20 py-2 border ${errors.password ? 'border-red-500' : inputStatus.password ? 'border-green-300' : 'border-gray-700'
                                            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/50 text-gray-100`}
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
                                        <RiRefreshLine className="h-5 w-5 text-gray-400 hover:text-blue-400" />
                                    </button>
                                </div>
                                <div className="mt-2">
                                    <div className="flex space-x-1">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded-full ${level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-700'
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
                                            <span className="text-xs text-gray-400">8+ characters</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {passwordRequirements.uppercase ? (
                                                <RiCheckboxCircleLine className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <RiCheckboxBlankCircleLine className="h-4 w-4 text-gray-400" />
                                            )}
                                            <span className="text-xs text-gray-400">Uppercase letter</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {passwordRequirements.lowercase ? (
                                                <RiCheckboxCircleLine className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <RiCheckboxBlankCircleLine className="h-4 w-4 text-gray-400" />
                                            )}
                                            <span className="text-xs text-gray-400">Lowercase letter</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {passwordRequirements.number ? (
                                                <RiCheckboxCircleLine className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <RiCheckboxBlankCircleLine className="h-4 w-4 text-gray-400" />
                                            )}
                                            <span className="text-xs text-gray-400">Number</span>
                                        </div>
                                    </div>
                                    {formData.password && (
                                        <button
                                            type="button"
                                            onClick={copyToClipboard}
                                            className="mt-2 flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                                        >
                                            <RiFileCopyLine className="h-4 w-4" />
                                            <span>Copy to clipboard</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
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
                                        className={`block w-full pl-10 pr-20 py-2 border ${errors.confirmPassword ? 'border-red-500' : inputStatus.confirmPassword ? 'border-green-300' : 'border-gray-700'
                                            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/50 text-gray-100`}
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        {inputStatus.confirmPassword ? (
                                            <div className="flex items-center space-x-1 whitespace-nowrap bg-gray-900 px-2 rounded">
                                                <RiCheckLine className="h-5 w-5 text-green-500" />
                                                <span className="text-xs text-green-500">Match</span>
                                            </div>
                                        ) : formData.confirmPassword ? (
                                            <div className="flex items-center space-x-1 whitespace-nowrap bg-gray-900 px-2 rounded">
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
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-400">
                                    I agree to the{' '}
                                    <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                                        Terms and Conditions
                                    </Link>
                                </label>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !acceptedTerms}
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all relative group overflow-hidden text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Creating account...
                                        </div>
                                    ) : (
                                        'Create account'
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-400">
                                Already have an account?{' '}
                                <Link to="/login" className="text-blue-400 hover:text-blue-300">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}

export default Register 