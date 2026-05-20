import React from 'react';
import { render } from '@testing-library/react-native';
import { useDatabase } from '../context/DatabaseContext';
import { View, Text } from 'react-native';

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
}));

// Mock MaterialIcons and Image to avoid native module issues
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock supabase to avoid AsyncStorage issues
jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn(),
  },
}));

const DummyProfile = () => {
  const { profile } = useDatabase();
  return (
    <View>
      <Text>{profile?.username}</Text>
    </View>
  );
};

describe('Test Environment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDatabase as jest.Mock).mockReturnValue({
      profile: { username: 'TESTUSER', points: 100, balance: 5000, friends: [] },
      loading: false,
    });
  });

  test('can render a simple component', () => {
    const { getByText } = render(<DummyProfile />);
    expect(getByText('TESTUSER')).toBeTruthy();
  });
});
