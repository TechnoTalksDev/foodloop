import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '@/context/supabase-provider';

// Mock expo modules
jest.mock('expo-router');
jest.mock('expo-auth-session');
jest.mock('expo-web-browser');
jest.mock('expo-linking');

// Test component that uses the auth context
const TestComponent = () => {
  const { session, initialized, signInWithGoogle, signOut } = useAuth();
  
  return (
    <>
      <Text testID="initialized">{initialized ? 'true' : 'false'}</Text>
      <Text testID="session">{session ? 'logged-in' : 'logged-out'}</Text>
      <Text testID="email">{session?.user?.email || 'no-email'}</Text>
    </>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial auth state', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially should not be initialized
    expect(getByTestId('initialized').children[0]).toBe('false');
    expect(getByTestId('session').children[0]).toBe('logged-out');
    expect(getByTestId('email').children[0]).toBe('no-email');
  });

  it('should handle successful session initialization', async () => {
    // Mock successful session retrieval
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      },
      access_token: 'test-token'
    };

    const { supabase } = require('@/config/supabase');
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('initialized').children[0]).toBe('true');
    });

    expect(getByTestId('session').children[0]).toBe('logged-in');
    expect(getByTestId('email').children[0]).toBe('test@example.com');
  });

  it('should handle session initialization errors', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session expired' }
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('initialized').children[0]).toBe('true');
    });

    expect(getByTestId('session').children[0]).toBe('logged-out');
  });

  it('should provide signInWithGoogle function', () => {
    const { result } = require('@testing-library/react-hooks').renderHook(
      () => useAuth(),
      {
        wrapper: AuthProvider
      }
    );

    expect(typeof result.current.signInWithGoogle).toBe('function');
  });

  it('should provide signOut function', () => {
    const { result } = require('@testing-library/react-hooks').renderHook(
      () => useAuth(),
      {
        wrapper: AuthProvider
      }
    );

    expect(typeof result.current.signOut).toBe('function');
  });

  it('should handle Google sign in', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/oauth...' },
      error: null
    });

    const TestSignIn = () => {
      const { signInWithGoogle } = useAuth();
      
      React.useEffect(() => {
        signInWithGoogle();
      }, []);

      return <Text>Sign in test</Text>;
    };

    render(
      <AuthProvider>
        <TestSignIn />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.any(String),
          skipBrowserRedirect: true
        }
      });
    });
  });

  it('should handle sign out', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.auth.signOut.mockResolvedValue({ error: null });

    const TestSignOut = () => {
      const { signOut } = useAuth();
      
      React.useEffect(() => {
        signOut();
      }, []);

      return <Text>Sign out test</Text>;
    };

    render(
      <AuthProvider>
        <TestSignOut />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('should handle auth state changes', async () => {
    const { supabase } = require('@/config/supabase');
    
    // Mock the auth state change subscription
    const mockUnsubscribe = jest.fn();
    const mockSubscription = { unsubscribe: mockUnsubscribe };
    
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription }
    });

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();

    // Cleanup should unsubscribe
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      require('@testing-library/react-hooks').renderHook(() => useAuth());
    }).toThrow();

    consoleSpy.mockRestore();
  });
});
