import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ConfirmRequest {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

interface UiState {
  toasts: Toast[];
  confirmReq: ConfirmRequest | null;
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
  setConfirm: (req: ConfirmRequest | null) => void;
}

let nextId = 1;
export const useUi = create<UiState>((set) => ({
  toasts: [],
  confirmReq: null,
  push: (kind, message) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), kind === 'error' ? 6000 : 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setConfirm: (confirmReq) => set({ confirmReq }),
}));

export const toast = {
  success: (m: string) => useUi.getState().push('success', m),
  error: (m: string) => useUi.getState().push('error', m),
  info: (m: string) => useUi.getState().push('info', m),
};

/** Promise-based confirmation dialog: `if (await confirm({...})) ...` */
export function confirm(opts: Omit<ConfirmRequest, 'resolve'>) {
  return new Promise<boolean>((resolve) => useUi.getState().setConfirm({ ...opts, resolve }));
}
