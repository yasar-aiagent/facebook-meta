import React, { useState, FormEvent } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/config';
import './Auth.css';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    // Check if email is from @scalex.club domain
    if (!email.endsWith('@scalex.club')) {
      setError('Please use your @scalex.club email address');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setError('');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
        {/* Icon */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <svg width="24" height="24" className="sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">Reset Password</h2>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          {success ? 'Check your email!' : 'Enter your email to receive reset instructions'}
        </p>
        
        {success ? (
          /* Success State */
          <div className="text-center space-y-4">
            {/* Success Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg width="32" height="32" className="sm:w-10 sm:h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Email Sent!</h3>
            
            <div className="space-y-2 text-sm sm:text-base text-gray-700">
              <p>We've sent password reset instructions to:</p>
              <p className="font-semibold text-indigo-600 break-all">{email}</p>
              <p className="pt-2">Please check your inbox and follow the link to reset your password.</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-xs sm:text-sm text-yellow-800">
                Don't see the email? Check your spam folder.
              </p>
            </div>
            
            <button 
              onClick={onBackToLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors text-sm sm:text-base mt-6"
            >
              Back to Login
            </button>
          </div>
        ) : (
          /* Form State */
          <>
            <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@scalex.club"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm sm:text-base text-gray-600">
                Remember your password?{' '}
                <button 
                  type="button" 
                  onClick={onBackToLogin} 
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Back to Login
                </button>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs sm:text-sm text-gray-500">
          Need help? Contact{' '}
          <a href="mailto:support@scalex.club" className="text-indigo-600 hover:text-indigo-700 font-medium">
            support@scalex.club
          </a>
        </p>
      </div>
    </div>
  </div>
);
};

export default ForgotPassword;