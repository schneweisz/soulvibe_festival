import React from 'react';
import { render } from '@testing-library/react-native';
import TicketShopScreen from '../app/ticket_shop';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { useLanguage } from '../context/LanguageContext';

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
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: jest.fn(),
  },
}));

describe('TicketShopScreen', () => {
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
      profile: { balance: 50000, points: 100 },
      refreshAll: jest.fn(),
      loading: false,
    });
  });

  test('renders ticket options', () => {
    const { getAllByText } = render(<TicketShopScreen />);
    expect(getAllByText('BASE').length).toBeGreaterThan(0);
    expect(getAllByText('VIP').length).toBeGreaterThan(0);
    expect(getAllByText('BUY NOW').length).toBeGreaterThan(0);
  });
});
