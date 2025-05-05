import { Component } from 'react'
import { RiErrorWarningLine, RiRefreshLine, RiBugLine } from 'react-icons/ri'
import PropTypes from 'prop-types'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorType: null
    }
  }

  static getDerivedStateFromError(error) {
    let errorType = 'UNKNOWN'
    
    if (error instanceof TypeError) {
      errorType = 'TYPE_ERROR'
    } else if (error instanceof RangeError) {
      errorType = 'RANGE_ERROR'
    } else if (error instanceof ReferenceError) {
      errorType = 'REFERENCE_ERROR'
    } else if (error instanceof SyntaxError) {
      errorType = 'SYNTAX_ERROR'
    } else if (error.name === 'NetworkError') {
      errorType = 'NETWORK_ERROR'
    }

    return { hasError: true, error, errorType }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo)
  }

  getErrorMessage() {
    const { errorType } = this.state
    
    switch (errorType) {
      case 'TYPE_ERROR':
        return 'There was a type mismatch in the application. Please try again.'
      case 'RANGE_ERROR':
        return 'A value is outside the allowed range. Please check your input.'
      case 'REFERENCE_ERROR':
        return 'A reference to an undefined variable was made. Please refresh the page.'
      case 'SYNTAX_ERROR':
        return 'There was a syntax error in the code. Please contact support.'
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  getErrorAction() {
    const { errorType } = this.state
    
    switch (errorType) {
      case 'NETWORK_ERROR':
        return {
          text: 'Check Connection',
          action: () => {
            // Add network check logic here
            window.location.reload()
          }
        }
      case 'TYPE_ERROR':
      case 'RANGE_ERROR':
        return {
          text: 'Clear Form',
          action: () => {
            // Add form clearing logic here
            window.location.reload()
          }
        }
      default:
        return {
          text: 'Reload Page',
          action: () => window.location.reload()
        }
    }
  }

  render() {
    if (this.state.hasError) {
      const errorAction = this.getErrorAction()
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <RiErrorWarningLine className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4">
                {this.getErrorMessage()}
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={errorAction.action}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                >
                  <RiRefreshLine className="mr-2" />
                  {errorAction.text}
                </button>
                <button
                  onClick={() => {
                    // Add error reporting logic here
                    console.error('Error reported:', this.state.error)
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center"
                >
                  <RiBugLine className="mr-2" />
                  Report Error
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
}

export default ErrorBoundary 