// context/agency-mode-provider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';

interface AgencyModeContextType {
  isAgencyMode: boolean;
  activateAgencyMode: () => void;
  deactivateAgencyMode: () => void;
  getAgencyLogo: () => any;
}

const AgencyModeContext = createContext<AgencyModeContextType | undefined>(undefined);

const AGENCY_MODE_KEY = '@foodloop_agency_mode';

export const AgencyModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAgencyMode, setIsAgencyMode] = useState(false);

  // Load agency mode state on app start
  useEffect(() => {
    loadAgencyModeState();
  }, []);

  const loadAgencyModeState = async () => {
    try {
      const storedValue = await AsyncStorage.getItem(AGENCY_MODE_KEY);
      if (storedValue === 'true') {
        setIsAgencyMode(true);
      }
    } catch (error) {
      console.error('Error loading agency mode state:', error);
    }
  };

  const activateAgencyMode = async () => {
    try {
      setIsAgencyMode(true);
      await AsyncStorage.setItem(AGENCY_MODE_KEY, 'true');
      // Haptic feedback for activation
      Vibration.vibrate([50, 100, 50]);
    } catch (error) {
      console.error('Error saving agency mode state:', error);
    }
  };

  const deactivateAgencyMode = async () => {
    try {
      setIsAgencyMode(false);
      await AsyncStorage.setItem(AGENCY_MODE_KEY, 'false');
    } catch (error) {
      console.error('Error saving agency mode state:', error);
    }
  };

  const getAgencyLogo = () => {
    if (!isAgencyMode) {
      return require('@/assets/2.png'); // Default logo
    }
    
    // 10% chance for female, 90% chance for male
    const isFemale = Math.random() < 0.1;
    return isFemale 
      ? require('@/assets/foodloop-female.png')
      : require('@/assets/foodloop-male.png');
  };

  const value = {
    isAgencyMode,
    activateAgencyMode,
    deactivateAgencyMode,
    getAgencyLogo,
  };

  return (
    <AgencyModeContext.Provider value={value}>
      {children}
    </AgencyModeContext.Provider>
  );
};

export const useAgencyMode = () => {
  const context = useContext(AgencyModeContext);
  if (context === undefined) {
    throw new Error('useAgencyMode must be used within an AgencyModeProvider');
  }
  return context;
};