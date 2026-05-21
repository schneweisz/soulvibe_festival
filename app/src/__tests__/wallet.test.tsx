import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import WalletScreen from '../app/wallet';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../utils/supabase';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../context/DatabaseContext', () => ({ useDatabase: jest.fn() }));
jest.mock('../context/LanguageContext', () => ({ useLanguage: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@expo/vector-icons', () => ({ MaterialIcons: 'MaterialIcons' }));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('../components/screen-header', () => ({ ScreenHeader: 'ScreenHeader' }));
jest.mock('../components/themed-view', () => ({ ThemedView: ({ children }: any) => children }));

// Mock supabase to avoid AsyncStorage issues
jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { points: 100 }, error: null }),
      insert: jest.fn().mockReturnThis(),
    }),
    rpc: jest.fn(),
  },
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('WalletScreen', () => {
  const mockRefreshAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useLanguage as jest.Mock).mockReturnValue({ 
        lang: 'en', 
        t: (en: string, hu: string) => en 
    });
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: '123' } },
    });
    (useDatabase as jest.Mock).mockReturnValue({
      profile: { balance: 5000 },
      transactions: [],
      refreshAll: mockRefreshAll,
      refreshProfile: jest.fn(),
      loading: false,
    });
  });

  test('renders balance correctly', () => {
    const { getAllByText } = render(<WalletScreen />);
    expect(getAllByText(/5[.,]000|5000/).length).toBeGreaterThan(0);
  });

  test('top up button triggers supabase logic', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = render(<WalletScreen />);
    
    const input = getByPlaceholderText('e.g. 15000');
    fireEvent.changeText(input, '2000');
    
    const topUpBtn = getByText(/TOP UP/);
    fireEvent.press(topUpBtn);
    
    // We expect refreshAll to be called after the process completes
    // In our manual update logic, it calls rpc OR multiple from() chain calls
    await waitFor(() => {
      expect(mockRefreshAll).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});
