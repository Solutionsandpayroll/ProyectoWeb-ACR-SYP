"use client";

import { createContext, useContext, useRef, useCallback, ReactNode } from "react";

/** Called by the page when navigation is requested while there are unsaved changes.
 *  The page must show its confirmation UI and call `proceed()` if the user confirms. */
type GuardFn = (href: string, proceed: () => void) => void;

interface NavigationGuardContextValue {
  /** Register a guard function. Pass null to unregister. */
  setGuard: (fn: GuardFn | null) => void;
  /** Called by the Sidebar before navigating. Calls navigate() immediately if no guard. */
  checkAndNavigate: (href: string, navigate: () => void) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue>({
  setGuard: () => {},
  checkAndNavigate: (_href, navigate) => navigate(),
});

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<GuardFn | null>(null);

  const setGuard = useCallback((fn: GuardFn | null) => {
    guardRef.current = fn;
  }, []);

  const checkAndNavigate = useCallback((href: string, navigate: () => void) => {
    if (guardRef.current) {
      guardRef.current(href, navigate);
    } else {
      navigate();
    }
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ setGuard, checkAndNavigate }}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
