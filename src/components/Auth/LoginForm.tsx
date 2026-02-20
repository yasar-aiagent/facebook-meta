import React, { useState, FormEvent } from 'react';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/firebase/config';
import './Auth.css';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);

  const handleResendVerification = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setError('Verification email sent! Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setNeedsVerification(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        setNeedsVerification(true);
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        await auth.signOut(); // Sign out the unverified user
        setLoading(false);
        return;
      }
      
      // If verified, user will be automatically redirected to dashboard
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
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
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-1 sm:mb-2">Welcome Back</h2>
        <p className="text-base sm:text-lg font-semibold text-indigo-600 text-center mb-6 sm:mb-8">ScaleX</p>
        
        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          {/* Email Field */}
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
          
          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <button 
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-red-800 mb-2">{error}</p>
              {needsVerification && (
                <button 
                  type="button"
                  onClick={handleResendVerification}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline"
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}

          {/* Submit Button */}
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
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm sm:text-base text-gray-600">
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={onSwitchToSignup} 
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs sm:text-sm text-gray-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Terms of Service
          </a>
          {' and '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  </div>
);
};

export default LoginForm;