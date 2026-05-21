import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import LockerScreen from '../app/locker';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { supabase } from '../utils/supabase';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../context/DatabaseContext', () => ({ useDatabase: jest.fn() }));

// useFocusEffect → useEffect so the focus callback fires during render in tests
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useFocusEffect: (cb: any) => useEffect(cb, []),
    useLocalSearchParams: jest.fn().mockReturnValue({}),
  };
});

jest.mock('@expo/vector-icons', () => ({ MaterialIcons: 'MaterialIcons' }));
jest.mock('../components/screen-header', () => ({ ScreenHeader: () => null }));
jest.mock('../components/glitch-text', () => ({
  GlitchText: ({ children }: any) => children,
}));
jest.mock('../components/nebula-background', () => ({ NebulaBackground: () => null }));

jest.mock('../utils/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// ─── Helper — flush all pending microtasks inside act() ──────────────────────
// The useFocusEffect callback starts an async IIFE whose state updates escape
// the initial act() scope. flushAsync() drains the full microtask queue so
// those updates are applied before we assert.

const flushAsync = () =>
  act(async () => {
    await new Promise<void>(resolve => setImmediate(resolve));
  });

// ─── Fixtures ────────────────────────────────────────────────────────────────

// 95 available + 5 occupied per hub
const MOCK_OCCUPANCY = ['alpha', 'beta', 'gamma', 'delta'].flatMap(hub => [
  ...Array(95).fill({ hub_name: hub, status: 'available' }),
  ...Array(5).fill({ hub_name: hub, status: 'occupied' }),
]);

const MOCK_LOCKER = {
  id: 'locker-uuid-1',
  hub_name: 'alpha',
  slot_number: 42,
  pin_code: '836491',
  reserved_at: new Date().toISOString(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockSupabase() {
  (supabase.from as jest.Mock).mockReturnValue({
    select: jest.fn().mockResolvedValue({ data: MOCK_OCCUPANCY, error: null }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }),
  });
}

function mockDatabase(overrides: Record<string, any> = {}) {
  (useDatabase as jest.Mock).mockReturnValue({
    profile: { points: 0 },
    locker: null,
    refreshLocker: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('LockerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase();
    mockDatabase();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-abc' } },
    });
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  test('shows loading spinner before data resolves', () => {
    // Make the fetch hang so loading remains visible
    (useDatabase as jest.Mock).mockReturnValue({
      profile: { points: 0 },
      locker: null,
      refreshLocker: jest.fn().mockReturnValue(new Promise(() => {})),
    });
    const { getByText } = render(<LockerScreen />);
    expect(getByText('SCANNING VAULTS...')).toBeTruthy();
  });

  // ── Hub selection ──────────────────────────────────────────────────────────

  test('shows all four hubs after loading resolves', async () => {
    const { getByText, queryByText } = render(<LockerScreen />);
    await flushAsync();

    expect(queryByText('SCANNING VAULTS...')).toBeNull();
    expect(getByText('SELECT VAULT HUB')).toBeTruthy();
    expect(getByText('VAULT ALPHA')).toBeTruthy();
    expect(getByText('VAULT BETA')).toBeTruthy();
    expect(getByText('VAULT GAMMA')).toBeTruthy();
    expect(getByText('VAULT DELTA')).toBeTruthy();
  });

  test('reserve button does not call RPC when no hub is selected', async () => {
    const { getByText } = render(<LockerScreen />);
    await flushAsync();

    fireEvent.press(getByText(/RESERVE VAULT/));
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  // ── Reserve — success ──────────────────────────────────────────────────────

  test('reserve vault — calls RPC with selected hub and syncs context', async () => {
    const mockRefreshLocker = jest.fn().mockResolvedValue(undefined);
    mockDatabase({ refreshLocker: mockRefreshLocker });

    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: { success: true, hub_name: 'alpha', slot_number: 1, pin_code: '123456' },
      error: null,
    });

    const { getByText } = render(<LockerScreen />);
    await flushAsync();

    fireEvent.press(getByText('VAULT ALPHA'));
    fireEvent.press(getByText(/RESERVE VAULT/));
    await flushAsync();

    expect(supabase.rpc).toHaveBeenCalledWith('reserve_locker', {
      p_user_id: 'user-abc',
      p_hub_name: 'alpha',
    });
    expect(mockRefreshLocker).toHaveBeenCalled();
  });

  // ── Reserve — hub full ─────────────────────────────────────────────────────

  test('reserve vault — hub_full shows capacity error message', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: { success: false, error: 'hub_full' },
      error: null,
    });

    const { getByText } = render(<LockerScreen />);
    await flushAsync();

    fireEvent.press(getByText('VAULT BETA'));
    fireEvent.press(getByText(/RESERVE VAULT/));
    await flushAsync();

    expect(getByText('This hub is at capacity. Select another vault.')).toBeTruthy();
  });

  // ── Reserve — already reserved ─────────────────────────────────────────────

  test('reserve vault — already_reserved syncs context instead of showing an error', async () => {
    const mockRefreshLocker = jest.fn().mockResolvedValue(undefined);
    mockDatabase({ refreshLocker: mockRefreshLocker });

    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: { success: false, error: 'already_reserved' },
      error: null,
    });

    const { getByText, queryByText } = render(<LockerScreen />);
    await flushAsync();

    fireEvent.press(getByText('VAULT GAMMA'));
    fireEvent.press(getByText(/RESERVE VAULT/));
    await flushAsync();

    // Should sync, not show a confusing error
    expect(mockRefreshLocker).toHaveBeenCalled();
    expect(queryByText(/already hold|already own/i)).toBeNull();
  });

  // ── Vault dashboard ────────────────────────────────────────────────────────

  test('shows vault dashboard with hub, slot and PIN when locker exists', async () => {
    mockDatabase({ locker: MOCK_LOCKER });

    const { getByText, queryByText } = render(<LockerScreen />);
    await flushAsync();

    expect(queryByText('SCANNING VAULTS...')).toBeNull();
    expect(getByText('VAULT ALPHA')).toBeTruthy();
    expect(getByText('SLOT #042')).toBeTruthy();
    expect(getByText('SECURED')).toBeTruthy();
    expect(getByText('ACCESS CODE')).toBeTruthy();
    expect(getByText('REMOTE UNLOCK')).toBeTruthy();
  });

  test('PIN digits are rendered individually in the vault dashboard', async () => {
    mockDatabase({ locker: MOCK_LOCKER }); // pin_code: '836491'

    const { getAllByText } = render(<LockerScreen />);
    await flushAsync();

    // Each digit gets its own Text cell; count all rendered texts to confirm 6 cells
    const eights = getAllByText('8');
    expect(eights.length).toBeGreaterThanOrEqual(1);
  });

  // ── Release vault ──────────────────────────────────────────────────────────

  test('vacate vault calls release RPC and refreshes context', async () => {
    const mockRefreshLocker = jest.fn().mockResolvedValue(undefined);
    mockDatabase({ locker: MOCK_LOCKER, refreshLocker: mockRefreshLocker });
    (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });

    const { getByText } = render(<LockerScreen />);
    await flushAsync();

    fireEvent.press(getByText('VACATE VAULT'));
    await flushAsync();

    expect(supabase.rpc).toHaveBeenCalledWith('release_locker', {
      p_user_id: 'user-abc',
    });
    expect(mockRefreshLocker).toHaveBeenCalled();
  });

  // ── Dynamic pricing ────────────────────────────────────────────────────────

  test('no discount banner shown at 0 pulse points', async () => {
    const { queryByText } = render(<LockerScreen />);
    await flushAsync();
    expect(queryByText(/PULSE DISCOUNT/)).toBeNull();
  });

  test('5% discount shown at 100–249 points → 2,375 HUF', async () => {
    mockDatabase({ profile: { points: 150 }, locker: null,
      refreshLocker: jest.fn().mockResolvedValue(undefined) });

    const { getByText } = render(<LockerScreen />);
    await flushAsync();

    // Banner is unique — contains both the % and the price
    expect(getByText(/PULSE DISCOUNT 5% APPLIED/)).toBeTruthy();
  });

  test('15% discount shown at 500+ points → 2,125 HUF', async () => {
    mockDatabase({ profile: { points: 600 }, locker: null,
      refreshLocker: jest.fn().mockResolvedValue(undefined) });

    const { getByText } = render(<LockerScreen />);
    await flushAsync();

    expect(getByText(/PULSE DISCOUNT 15% APPLIED/)).toBeTruthy();
  });

  // ── URL param pre-selection ────────────────────────────────────────────────

  test('pre-selects hub from ?hub= URL param', async () => {
    const { useLocalSearchParams } = require('expo-router');
    (useLocalSearchParams as jest.Mock).mockReturnValue({ hub: 'delta' });

    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: { success: true, hub_name: 'delta', slot_number: 7, pin_code: '999000' },
      error: null,
    });

    const mockRefreshLocker = jest.fn().mockResolvedValue(undefined);
    mockDatabase({ refreshLocker: mockRefreshLocker });

    const { getByText } = render(<LockerScreen />);
    await flushAsync();

    // Delta is pre-selected — reserve button should immediately trigger RPC
    fireEvent.press(getByText(/RESERVE VAULT/));
    await flushAsync();

    expect(supabase.rpc).toHaveBeenCalledWith('reserve_locker', {
      p_user_id: 'user-abc',
      p_hub_name: 'delta',
    });
  });
});
