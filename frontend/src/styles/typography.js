export const typography = {
    // Headings
    h1: 'text-3xl font-bold tracking-tight text-gray-900 dark:text-white',
    h2: 'text-2xl font-semibold text-gray-900 dark:text-white',
    h3: 'text-xl font-medium text-gray-900 dark:text-white',
    h4: 'text-lg font-medium text-gray-900 dark:text-white',

    // Body text
    body: {
        lg: 'text-lg text-gray-600 dark:text-gray-300',
        base: 'text-base text-gray-600 dark:text-gray-300',
        sm: 'text-sm text-gray-600 dark:text-gray-300',
    },

    // Display text (larger than headings)
    display: {
        xl: 'text-5xl font-bold tracking-tight text-gray-900 dark:text-white',
        lg: 'text-4xl font-bold tracking-tight text-gray-900 dark:text-white',
    },

    // Subtle text
    muted: {
        base: 'text-base text-gray-500 dark:text-gray-400',
        sm: 'text-sm text-gray-500 dark:text-gray-400',
        xs: 'text-xs text-gray-500 dark:text-gray-400',
    },

    // Interactive elements
    link: 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200',

    // Form elements
    label: 'text-sm font-medium text-gray-700 dark:text-gray-200',
    helper: 'text-xs text-gray-500 dark:text-gray-400',
    error: 'text-sm text-red-600 dark:text-red-400',
    success: 'text-sm text-green-600 dark:text-green-400',

    // Special cases
    gradient: 'bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400',
}

export const input = {
    base: `
        block w-full rounded-lg border-gray-200 dark:border-gray-600 
        bg-white dark:bg-gray-700 
        text-gray-900 dark:text-white 
        placeholder-gray-400 dark:placeholder-gray-400 
        focus:border-primary-500 dark:focus:border-primary-500 
        focus:ring-primary-500 dark:focus:ring-primary-500
        transition-colors duration-200
    `,
    error: `
        border-red-300 dark:border-red-600 
        text-red-900 dark:text-red-100 
        placeholder-red-300 dark:placeholder-red-400 
        focus:border-red-500 dark:focus:border-red-500 
        focus:ring-red-500 dark:focus:ring-red-500
    `,
    success: `
        border-green-300 dark:border-green-600 
        text-green-900 dark:text-green-100 
        placeholder-green-300 dark:placeholder-green-400 
        focus:border-green-500 dark:focus:border-green-500 
        focus:ring-green-500 dark:focus:ring-green-500
    `,
}

export const button = {
    // Main variants
    primary: 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white shadow-sm shadow-primary-600/10 dark:shadow-primary-900/20',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',

    // State variants
    danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-sm shadow-red-600/10 dark:shadow-red-900/20',
    success: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white shadow-sm shadow-green-600/10 dark:shadow-green-900/20',
    warning: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-400 dark:hover:bg-yellow-500 text-white shadow-sm shadow-yellow-500/10 dark:shadow-yellow-900/20',
    info: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm shadow-blue-600/10 dark:shadow-blue-900/20',

    // Size variants
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',

    // Icon button variants
    icon: {
        sm: 'p-1',
        md: 'p-2',
        lg: 'p-3',
    },
} 