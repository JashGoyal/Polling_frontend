import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [requiresProfile, setRequiresProfile] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`);
      setUser(data.user);
      setRequiresProfile(!data.user.isProfileComplete);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);


  const saveAuth = (tokenVal, userData, profileRequired = false) => {
    sessionStorage.setItem('token', tokenVal);
    sessionStorage.setItem('user-name', userData.name);
    sessionStorage.setItem('user-email', userData.email);
    sessionStorage.setItem('user-role', userData.role);
    setToken(tokenVal);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenVal}`;
    setUser(userData);
    setRequiresProfile(profileRequired);
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password });
    saveAuth(data.token, data.user, data.requiresProfile);
    toast.success('Account created! Please complete your profile.');
    return data;
  };

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
    saveAuth(data.token, data.user, false);
    toast.success('Welcome back!');
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await axios.post(`${API_URL}/auth/google`, { credential });
    saveAuth(data.token, data.user, data.requiresProfile);
    if (data.requiresProfile) {
      toast.success('Logged in with Google! Complete your profile.');
    } else {
      toast.success('Welcome back!');
    }
    return data;
  };

  const completeProfile = async (profileData) => {
    const { data } = await axios.put(`${API_URL}/auth/complete-profile`, profileData);
    setUser(data.user);
    setRequiresProfile(false);
    toast.success('Profile completed!');
    return data;
  };

  const updateProfile = async (profileData) => {
    const { data } = await axios.put(`${API_URL}/users/profile`, profileData);
    setUser(data.user);
    toast.success('Profile updated!');
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    setRequiresProfile(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, requiresProfile,
      register, login, googleLogin, completeProfile, updateProfile, logout, fetchMe
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
