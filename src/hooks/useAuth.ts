// // hooks/useAuth.ts
// import { useState, useCallback, useEffect } from 'react';
// import { authService } from '../services/auth.services';
// import { translationService } from '../services/translation.service';
// import { UserContext } from '../types';

// export const useAuth = () => {
//   const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
//   const [userContext, setUserContext] = useState<UserContext | null>(null);
//   const [loginError, setLoginError] = useState<string | null>(null);
//   const [languageOptions, setLanguageOptions] = useState<string[]>([]);
//   const [isRedirecting, setIsRedirecting] = useState(false);

//   // Check authentication on mount
//   useEffect(() => {
//     const token = authService.getToken();
//     if (token) {
//       setIsLoggedIn(true);
//       // Could fetch user context here if needed
//     }
//   }, []);

//   const login = useCallback(async (username: string, password: string) => {
//     setLoginError(null);
//     try {
//       const data = await authService.login(username, password);
      
//       sessionStorage.setItem("token", data.access_token || '');
//       console.log("Token set after sessionStorage.setitem", data.access_token);
      
//       setLanguageOptions(data.languages_allowed || []);
//       setUserContext(data);
//       setIsLoggedIn(true);
      
//       // Fetch recent translations
//       if (data.username) {
//         await fetchRecentTranslations(data.username);
//       }
      
//       return data;
//     } catch (err) {
//       setLoginError((err as Error).message);
//       throw err;
//     }
//   }, []);

//   const logout = useCallback(() => {
//     setIsLoggedIn(false);
//     setUserContext(null);
//     setLanguageOptions([]);
//     authService.logout();
//   }, []);

//   const fetchRecentTranslations = useCallback(async (username: string) => {
//     try {
//       const data = await translationService.fetchThumbnails(username);
//       console.log("After calling fetchRecentTranslations service:",data)
//       return data;
//     } catch (err) {
//       console.error("Error fetching recent translations:", err);
//       return [];
//     }
//   }, []);

//   return {
//     isLoggedIn,
//     userContext,
//     loginError,
//     languageOptions,
//     isRedirecting,
//     setIsRedirecting,
//     login,
//     logout,
//     fetchRecentTranslations
//   };
// };


// hooks/useAuth.ts
import { useState, useCallback, useEffect } from 'react';
import { authService } from '../services/auth.services';
import { translationService } from '../services/translation.service';
import { UserContext } from '../types';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [recentTranslations, setRecentTranslations] = useState<any[]>([]); // Add this

  // Check authentication on mount
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      setIsLoggedIn(true);
      // Could fetch user context here if needed
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoginError(null);
    try {
      const data = await authService.login(username, password);
      
      sessionStorage.setItem("token", data.access_token || '');
      console.log("Token set after sessionStorage.setitem", data.access_token);
      
      setLanguageOptions(data.languages_allowed || []);
      setUserContext(data);
      setIsLoggedIn(true);
      
      // Fetch recent translations and store in state
      if (data.username) {
        const translations = await fetchRecentTranslations(data.username);
        setRecentTranslations(translations || []); // Store in state
      }
      
      return data;
    } catch (err) {
      setLoginError((err as Error).message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUserContext(null);
    setLanguageOptions([]);
    setRecentTranslations([]); // Clear recent translations on logout
    authService.logout();
  }, []);

  const fetchRecentTranslations = useCallback(async (username: string) => {
    try {
      const data = await translationService.fetchThumbnails(username);
      console.log("After calling fetchRecentTranslations service:", data);
      return data;
    } catch (err) {
      console.error("Error fetching recent translations:", err);
      return [];
    }
  }, []);

  return {
    isLoggedIn,
    userContext,
    loginError,
    languageOptions,
    isRedirecting,
    recentTranslations, // Add this to return
    setIsRedirecting,
    login,
    logout,
    fetchRecentTranslations
  };
};