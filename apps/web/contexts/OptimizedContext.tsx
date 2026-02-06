'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';

// ============================================
// STATE TYPES
// ============================================

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface AppState {
  user: User | null;
  theme: 'light' | 'dark' | 'system';
  sidebar: {
    collapsed: boolean;
    activeItem: string | null;
  };
  notifications: {
    unread: number;
    hasNew: boolean;
  };
  preferences: {
    language: string;
    currency: string;
    dateFormat: string;
  };
}

interface AppActions {
  setUser: (user: User | null) => void;
  setTheme: (theme: AppState['theme']) => void;
  toggleSidebar: () => void;
  setSidebarItem: (item: string | null) => void;
  setUnreadCount: (count: number) => void;
  markNotificationsRead: () => void;
  setPreferences: (prefs: Partial<AppState['preferences']>) => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: AppState = {
  user: null,
  theme: 'system',
  sidebar: {
    collapsed: false,
    activeItem: null,
  },
  notifications: {
    unread: 0,
    hasNew: false,
  },
  preferences: {
    language: 'vi',
    currency: 'VND',
    dateFormat: 'dd/MM/yyyy',
  },
};

// ============================================
// REDUCER
// ============================================

type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_THEME'; payload: AppState['theme'] }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_ITEM'; payload: string | null }
  | { type: 'SET_UNREAD'; payload: number }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'SET_PREFERENCES'; payload: Partial<AppState['preferences']> };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebar: { ...state.sidebar, collapsed: !state.sidebar.collapsed },
      };

    case 'SET_SIDEBAR_ITEM':
      return {
        ...state,
        sidebar: { ...state.sidebar, activeItem: action.payload },
      };

    case 'SET_UNREAD':
      return {
        ...state,
        notifications: {
          unread: action.payload,
          hasNew: action.payload > state.notifications.unread,
        },
      };

    case 'MARK_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: { unread: 0, hasNew: false },
      };

    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    default:
      return state;
  }
}

// ============================================
// SPLIT CONTEXTS (for optimal re-renders)
// ============================================

// Actions context - stable reference, never causes re-renders
const AppActionsContext = createContext<AppActions | null>(null);

// Individual state contexts for granular subscriptions
const UserContext = createContext<User | null>(null);
const ThemeContext = createContext<AppState['theme']>('system');
const SidebarContext = createContext<AppState['sidebar']>(initialState.sidebar);
const NotificationsContext = createContext<AppState['notifications']>(initialState.notifications);
const PreferencesContext = createContext<AppState['preferences']>(initialState.preferences);

// ============================================
// PROVIDER
// ============================================

interface OptimizedAppProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function OptimizedAppProvider({
  children,
  initialUser = null,
}: OptimizedAppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    user: initialUser,
  });

  // Memoize actions to prevent unnecessary re-renders
  const actions = useMemo<AppActions>(
    () => ({
      setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
      setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
      toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
      setSidebarItem: (item) => dispatch({ type: 'SET_SIDEBAR_ITEM', payload: item }),
      setUnreadCount: (count) => dispatch({ type: 'SET_UNREAD', payload: count }),
      markNotificationsRead: () => dispatch({ type: 'MARK_NOTIFICATIONS_READ' }),
      setPreferences: (prefs) => dispatch({ type: 'SET_PREFERENCES', payload: prefs }),
    }),
    []
  );

  return (
    <AppActionsContext.Provider value={actions}>
      <UserContext.Provider value={state.user}>
        <ThemeContext.Provider value={state.theme}>
          <SidebarContext.Provider value={state.sidebar}>
            <NotificationsContext.Provider value={state.notifications}>
              <PreferencesContext.Provider value={state.preferences}>
                {children}
              </PreferencesContext.Provider>
            </NotificationsContext.Provider>
          </SidebarContext.Provider>
        </ThemeContext.Provider>
      </UserContext.Provider>
    </AppActionsContext.Provider>
  );
}

// ============================================
// HOOKS - Granular subscriptions
// ============================================

/**
 * Get current user - only re-renders when user changes
 */
export function useUser() {
  return useContext(UserContext);
}

/**
 * Get current theme - only re-renders when theme changes
 */
export function useAppTheme() {
  return useContext(ThemeContext);
}

/**
 * Get sidebar state - only re-renders when sidebar changes
 */
export function useSidebar() {
  return useContext(SidebarContext);
}

/**
 * Get notifications state - only re-renders when notifications change
 */
export function useNotifications() {
  return useContext(NotificationsContext);
}

/**
 * Get user preferences - only re-renders when preferences change
 */
export function usePreferences() {
  return useContext(PreferencesContext);
}

/**
 * Get app actions - stable reference, never causes re-renders
 */
export function useAppActions() {
  const actions = useContext(AppActionsContext);
  if (!actions) {
    throw new Error('useAppActions must be used within OptimizedAppProvider');
  }
  return actions;
}

// ============================================
// COMBINED HOOKS (when you need multiple values)
// ============================================

/**
 * Get user with actions - for components that need both
 */
export function useUserWithActions() {
  const user = useUser();
  const { setUser } = useAppActions();
  return { user, setUser };
}

/**
 * Get sidebar with toggle action
 */
export function useSidebarWithActions() {
  const sidebar = useSidebar();
  const { toggleSidebar, setSidebarItem } = useAppActions();
  return { ...sidebar, toggleSidebar, setSidebarItem };
}

/**
 * Get notifications with actions
 */
export function useNotificationsWithActions() {
  const notifications = useNotifications();
  const { setUnreadCount, markNotificationsRead } = useAppActions();
  return { ...notifications, setUnreadCount, markNotificationsRead };
}
