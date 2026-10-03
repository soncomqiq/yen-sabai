import { createContext, useContext } from 'react';
import type { ShopState, User } from '../domain/types';
import type { ShopService } from '../services/interface';

interface ShopContextValue {
  user: User;
  state: ShopState | null;
  service: ShopService;
  busy: boolean;
  error: string;
  actionError: string;
  clearActionError: () => void;
  run: (action: () => Promise<unknown>, message?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}
export const ShopContext = createContext<ShopContextValue | null>(null);
export function useShop() { return useContext(ShopContext)!; }