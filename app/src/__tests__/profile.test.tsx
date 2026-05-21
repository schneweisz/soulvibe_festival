import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../app/profile';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { useLanguage } from '../context/LanguageContext';
import { router } from 'expo-router';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../context/DatabaseContext', () => ({
  useDatabase: jest.fn(),
}));
jest.mock('../context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useFocusEffect: jest.fn(),
  Redirect: 'Redirect',
}));

// Mock MaterialIcons and Image to avoid native module issues
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock components that use safe area or complex native modules
jest.mock('../components/screen-header', () => ({
  ScreenHeader: 'ScreenHeader',
  CartFAB: 'CartFAB',
}));

// Mock ThemedView
jest.mock('../components/themed-view', () => ({
  ThemedView: ({ children }: any) => children,
}));

// Mock supabase
jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

describe('ProfileScreen', () => {
  const mockSignOut = jest.fn();
  const mockRefreshAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useLanguage as jest.Mock).mockReturnValue({ lang: 'en', setLang: jest.fn() });
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { email: 'test@example.com', id: '123' } },
      loading: false,
      signOut: mockSignOut,
    });
    (useDatabase as jest.Mock).mockReturnValue({
      profile: { username: 'TESTUSER', points: 100, balance: 5000, friends: [] },
      tickets: [],
      transactions: [],
      favourites: [],
      friends: [],
      pendingRequests: [],
      locker: null,
      loading: false,
      refreshAll: mockRefreshAll,
      refreshFriends: jest.fn(),
      refreshProfile: jest.fn(),
      refreshLocker: jest.fn(),
      updateUsername: jest.fn(),
      sendFriendRequest: jest.fn(),
      acceptFriendRequest: jest.fn(),
      rejectFriendRequest: jest.fn(),
      removeFriend: jest.fn(),
    });
  });

  test('renders user profile data correctly', () => {
    const { getByText } = render(<ProfileScreen />);
    
    expect(getByText('TESTUSER')).toBeTruthy();
    // Use regex to match 5000 with or without locale separators
    expect(getByText(/5[.,]000|5000/)).toBeTruthy(); 
    expect(getByText('100')).toBeTruthy(); // Points
  });

  test('sign out button calls signOut and navigates to auth', async () => {
    const { getByText } = render(<ProfileScreen />);
    const signOutBtn = getByText('DISCONNECT FROM GRID');
    
    fireEvent.press(signOutBtn);
    
    expect(mockSignOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/auth');
    });
  });
});
