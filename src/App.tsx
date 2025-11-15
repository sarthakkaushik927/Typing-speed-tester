// App.tsx
import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import TypingSpeedTester from './components/TypingSpeedTester';


type User = {
  email: string;
  password?: string; 
};
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for an existing user session on app load
    const checkAuthSession = () => {
      try {
        const result = window.localStorage.getItem('typingUserSession');
        if (result) {
          const parsedValue = JSON.parse(result);
          if (parsedValue) {
            setUser(parsedValue);
          }
        }
      } catch (error) {
        console.log('No active session found or JSON parse error.');
      }
      setIsLoading(false);
    };
    checkAuthSession();
  }, []);

  const handleAuthSuccess = (userData: User) => {
    try {
      // Create the user's session
      window.localStorage.setItem('typingUserSession', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user session', error);
    }
  };

  const handleLogout = () => {
    try {
      // Clear the user's session
      window.localStorage.setItem('typingUserSession', JSON.stringify(null)); 
      setUser(null);
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (isLoading) {
    // Simple loading screen to prevent auth flicker
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <span className="text-white text-xl">Loading...</span>
      </div>
    );
  }

  // This is the core logic:
  if (!user) {
    // If no user, show the login/signup screen
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // If user is logged in, show the main app
  return <TypingSpeedTester user={user} onLogout={handleLogout} />;
}