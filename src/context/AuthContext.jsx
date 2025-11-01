import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('ats-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Simulate authentication API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const userData = {
        email,
        id: Date.now(),
        token: 'demo-token-' + Date.now()
      };

      setUser(userData);
      localStorage.setItem('ats-user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email, password) => {
    try {
      // Simulate registration API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const userData = {
        email,
        id: Date.now(),
        token: 'demo-token-' + Date.now()
      };

      setUser(userData);
      localStorage.setItem('ats-user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ats-user');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
