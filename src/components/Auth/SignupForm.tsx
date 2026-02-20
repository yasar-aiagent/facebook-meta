import React, { useState, FormEvent } from 'react';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import './Auth.css';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

interface PasswordStrength {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState<boolean>(false);

  // Check password strength
  const checkPasswordStrength = (pass: string): PasswordStrength => {
    return {
      hasMinLength: pass.length >= 8,
      hasUpperCase: /[A-Z]/.test(pass),
      hasLowerCase: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    };
  };

  const passwordStrength = checkPasswordStrength(password);
  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Check if email is from @scalex.club domain
    if (!email.endsWith('@scalex.club')) {
      setError('Only @scalex.club email addresses are allowed to sign up');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check password strength
    if (!isPasswordStrong) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);

    try {
      // Create user account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        name: name,
        adIds: [],
        emailVerified: false,
        createdAt: Timestamp.now()
      });
      
      // Send verification email (OTP)
      await sendEmailVerification(userCredential.user);
      
      setSuccess(true);
      setError('');
      
      // Show success message and redirect to login after 3 seconds
      setTimeout(() => {
        onSwitchToLogin();
      }, 3000);
      
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
        {/* Icon */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <svg width="24" height="24" className="sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-1 sm:mb-2">Create Account</h2>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          Join <span className="font-semibold text-indigo-600">ScaleX</span> - Use your @scalex.club email
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

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Account Created Successfully!</h3>
            
            <div className="space-y-2 text-sm sm:text-base text-gray-700">
              <p>We've sent a verification email to</p>
              <p className="font-semibold text-indigo-600 break-all">{email}</p>
              <p className="pt-2">Please check your inbox and click the verification link to activate your account.</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-indigo-700 flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Redirecting to login...
              </p>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-gray-500">(@scalex.club only)</span>
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
            
            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Requirements */}
            {showPasswordRequirements && password && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Password must contain:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className={`w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 ${
                      passwordStrength.hasMinLength 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {passwordStrength.hasMinLength ? '✓' : '○'}
                    </span>
                    <span className={passwordStrength.hasMinLength ? 'text-gray-900' : 'text-gray-600'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className={`w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 ${
                      passwordStrength.hasUpperCase 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {passwordStrength.hasUpperCase ? '✓' : '○'}
                    </span>
                    <span className={passwordStrength.hasUpperCase ? 'text-gray-900' : 'text-gray-600'}>
                      One uppercase letter (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className={`w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 ${
                      passwordStrength.hasLowerCase 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {passwordStrength.hasLowerCase ? '✓' : '○'}
                    </span>
                    <span className={passwordStrength.hasLowerCase ? 'text-gray-900' : 'text-gray-600'}>
                      One lowercase letter (a-z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className={`w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 ${
                      passwordStrength.hasNumber 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {passwordStrength.hasNumber ? '✓' : '○'}
                    </span>
                    <span className={passwordStrength.hasNumber ? 'text-gray-900' : 'text-gray-600'}>
                      One number (0-9)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className={`w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 ${
                      passwordStrength.hasSpecialChar 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {passwordStrength.hasSpecialChar ? '✓' : '○'}
                    </span>
                    <span className={passwordStrength.hasSpecialChar ? 'text-gray-900' : 'text-gray-600'}>
                      One special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || !isPasswordStrong} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        )}

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm sm:text-base text-gray-600">
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={onSwitchToLogin} 
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs sm:text-sm text-gray-500">
          By creating an account, you agree to our{' '}
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

export default SignupForm;