import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { profileService } from '../services';
import { useAuth } from './AuthContext';
import { translations, wordReplacements } from '../translations';

export { translations };

export const BACKEND_SUPPORTED_LANGS = ['en', 'hi', 'gu'];
export const BACKEND_SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

export const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rate: 1, label: 'Indian Rupee' },
  USD: { symbol: '$', rate: 0.012, label: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.011, label: 'Euro' },
  GBP: { symbol: '£', rate: 0.0095, label: 'British Pound' },
  AED: { symbol: 'AED ', rate: 0.044, label: 'UAE Dirham' }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const auth = useAuth?.() || {};
  const user = auth.user;

  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('bmr_lang') || 'en';
  });

  const [currentCurrency, setCurrentCurrency] = useState(() => {
    return localStorage.getItem('bmr_currency') || 'INR';
  });

  const [updatingLang, setUpdatingLang] = useState(false);
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  // Sync state whenever backend user profile loads or preferences change
  useEffect(() => {
    if (user?.preferred_language) {
      const code = user.preferred_language.toLowerCase();
      if (translations[code] && code !== currentLang) {
        setCurrentLang(code);
        localStorage.setItem('bmr_lang', code);
      }
    }
    if (user?.preferred_currency && user.preferred_currency !== currentCurrency) {
      const curr = BACKEND_SUPPORTED_CURRENCIES.includes(user.preferred_currency)
        ? user.preferred_currency
        : 'INR';
      setCurrentCurrency(curr);
      localStorage.setItem('bmr_currency', curr);
    }
  }, [user?.preferred_language, user?.preferred_currency]);

  const changeLanguage = async (langCode) => {
    const code = langCode.split('-')[0].toLowerCase();
    const validLang = translations[code] ? code : 'en';

    if (validLang === currentLang || updatingLang) return;

    const previousLang = currentLang;
    setCurrentLang(validLang);
    localStorage.setItem('bmr_lang', validLang);

    const token = localStorage.getItem('accessToken');
    if (token) {
      setUpdatingLang(true);
      try {
        // Backend User model choices: en, hi, gu
        const backendLangCode = BACKEND_SUPPORTED_LANGS.includes(validLang) ? validLang : 'en';
        await profileService.updateLanguagePreference(backendLangCode);
        if (auth.updateProfile) {
          auth.updateProfile({ preferred_language: backendLangCode });
        }
      } catch (err) {
        console.warn('Could not sync preferred language to backend:', err);
        // Do not falsely show a saved preference if user is authenticated and backend fails
        setCurrentLang(previousLang);
        localStorage.setItem('bmr_lang', previousLang);
        if (auth.showToast) {
          auth.showToast('Failed to save language preference to your account.', 'error');
        }
      } finally {
        setUpdatingLang(false);
      }
    }
  };

  const changeCurrency = async (currencyCode) => {
    const validCurrency = BACKEND_SUPPORTED_CURRENCIES.includes(currencyCode) ? currencyCode : 'INR';

    if (validCurrency === currentCurrency || updatingCurrency) return;

    const previousCurrency = currentCurrency;
    setCurrentCurrency(validCurrency);
    localStorage.setItem('bmr_currency', validCurrency);

    const token = localStorage.getItem('accessToken');
    if (token) {
      setUpdatingCurrency(true);
      try {
        await profileService.updateCurrencyPreference(validCurrency);
        if (auth.updateProfile) {
          auth.updateProfile({ preferred_currency: validCurrency });
        }
      } catch (err) {
        console.warn('Could not sync preferred currency to backend:', err);
        // Do not falsely show a saved preference if user is authenticated and backend fails
        setCurrentCurrency(previousCurrency);
        localStorage.setItem('bmr_currency', previousCurrency);
        if (auth.showToast) {
          auth.showToast('Failed to save currency preference to your account.', 'error');
        }
      } finally {
        setUpdatingCurrency(false);
      }
    }
  };

  const formatPrice = (amountInINR) => {
    const cfg = CURRENCY_CONFIG[currentCurrency] || CURRENCY_CONFIG.INR;
    const num = Number(amountInINR) || 0;
    const converted = num * cfg.rate;
    return `${cfg.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const t = (key, fallback) => {
    if (!key && key !== 0) return '';
    const strKey = String(key).trim();
    if (!strKey) return '';

    const langDict = translations[currentLang] || translations.en;

    // 1. Exact match in current language dictionary
    if (langDict[strKey] !== undefined) return langDict[strKey];

    // 2. Direct lookup in English dictionary if key is an identifier
    if (currentLang === 'en' && translations.en[strKey] !== undefined) {
      return translations.en[strKey];
    }

    // 3. Dynamic multi-word translation for Hotel Names, Room Names, and Amenities
    if ((currentLang === 'hi' || currentLang === 'gu') && wordReplacements[currentLang]) {
      const repMap = wordReplacements[currentLang];
      const words = strKey.split(/(\s+|[.,/&()-]+)/);
      let translatedAny = false;
      const translatedWords = words.map((token) => {
        const clean = token.trim();
        if (clean && repMap[clean]) {
          translatedAny = true;
          return repMap[clean];
        }
        const cap = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
        if (clean && repMap[cap]) {
          translatedAny = true;
          return repMap[cap];
        }
        return token;
      });
      if (translatedAny) {
        return translatedWords.join('');
      }
    }

    // 4. Fallback to English dictionary or the original key
    return translations.en[strKey] !== undefined
      ? translations.en[strKey]
      : (fallback !== undefined ? fallback : key);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        currentCurrency,
        changeLanguage,
        changeCurrency,
        formatPrice,
        updatingLang,
        updatingCurrency,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
