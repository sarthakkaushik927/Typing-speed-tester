// AuthScreen.tsx
import React, { useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';

// Define types for props and user
type User = {
  email: string;
  password?: string;
};

type AuthScreenProps = {
  onAuthSuccess: (user: User) => void;
};

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const userStorageKey = `user-${email}`;

    if (isLogin) {
      // --- Login Logic ---
      try {
        const result = window.localStorage.getItem(userStorageKey);
        if (result) {
          const user: User = JSON.parse(result);
          if (user.password === password) {
            onAuthSuccess(user); // Success!
          } else {
            setError('Invalid email or password.');
          }
        } else {
          setError('No account found with this email. Please sign up.');
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
      }
    } else {
      // --- Signup Logic ---
      if (!email || !password) {
        setError('Email and password are required.');
        setIsLoading(false);
        return;
      }
      try {
        const result = window.localStorage.getItem(userStorageKey);
        if (result) {
          setError('This email is already registered. Please log in.');
        } else {
          const newUser: User = { email, password };
          window.localStorage.setItem(userStorageKey, JSON.stringify(newUser));
          onAuthSuccess(newUser); // Automatically log in after sign up
        }
      } catch (err) {
        setError('An error occurred during sign up.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-block relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative flex items-center justify-center gap-2 sm:gap-3 mb-3 px-8 py-4 bg-gray-900 rounded-3xl">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                TypeSpeed Pro
              </h1>
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-lg font-bold text-gray-900 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-gray-400 hover:text-yellow-400 transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}