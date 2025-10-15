// hooks/useAuth.ts
import { useState, useCallback, useEffect } from 'react';
import { authService } from '../services/auth.services';
import { translationService } from '../services/translation.service';
import { UserContext } from '../types';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [recentTranslations, setRecentTranslations] = useState<any[]>([]);

  const fetchRecentTranslations = useCallback(async (username: string) => {
    try {
      const data = await translationService.fetchThumbnails(username);
      console.log("After calling fetchRecentTranslations service:", data);
      setRecentTranslations(data || []); // Update state
      return data;
    } catch (err) {
      console.error("Error fetching recent translations:", err);
      setRecentTranslations([]); // Clear on error
      return [];
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUserContext(null);
    setLanguageOptions([]);
    setRecentTranslations([]);
    sessionStorage.removeItem('userContext'); // Clean up user context from storage
    authService.logout();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const token = authService.getToken();
    const storedUserContext = sessionStorage.getItem("userContext");

    if (token && storedUserContext) {
      try {
        const parsedContext: UserContext = JSON.parse(storedUserContext);
        setUserContext(parsedContext);
        setLanguageOptions(parsedContext.languages_allowed || []);
        setIsLoggedIn(true);
        
        if (parsedContext.username) {
          fetchRecentTranslations(parsedContext.username);
        }
      } catch (e) {
        console.error("Failed to parse user context from session storage, logging out.", e);
        logout(); // If context is corrupted, log out.
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [fetchRecentTranslations, logout]);

  const login = useCallback(async (username: string, password: string) => {
    setLoginError(null);
    try {
      const data = await authService.login(username, password);
      
      sessionStorage.setItem("token", data.access_token || '');
      sessionStorage.setItem("userContext", JSON.stringify(data)); // Persist user context
      
      setLanguageOptions(data.languages_allowed || []);
      setUserContext(data);
      setIsLoggedIn(true);
      
      if (data.username) {
        await fetchRecentTranslations(data.username);
      }
      
      return data;
    } catch (err) {
      setLoginError((err as Error).message);
      throw err;
    }
  }, [fetchRecentTranslations]);

  return {
    isLoggedIn,
    userContext,
    loginError,
    languageOptions,
    isRedirecting,
    recentTranslations,
    setIsRedirecting,
    login,
    logout,
    fetchRecentTranslations
  };
};