import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Tone = 'success' | 'error';

interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const useToast = (): ToastApi => {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return api;
};

export const errorMessage = (error: unknown, fallback: string): string => {
  const detail = (error as { data?: { message?: string | string[] } })?.data
    ?.message;
  if (Array.isArray(detail)) {
    return detail[0];
  }
  return detail ?? fallback;
};

const ToastRow = ({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <li
      role="status"
      className="pointer-events-auto flex items-start gap-3 rounded-lg border
                 border-rule-strong bg-paper-raised px-4 py-3 shadow-lg shadow-ink/10
                 animate-[toast-in_220ms_cubic-bezier(0.16,1,0.3,1)]"
    >
      <span
        aria-hidden="true"
        className={`mt-1.5 size-2 shrink-0 rounded-full ${
          toast.tone === 'success' ? 'bg-brand' : 'bg-danger'
        }`}
      />
      <p className="flex-1 text-[0.8125rem] leading-snug text-ink">
        {toast.message}
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 mt-0.5 shrink-0 text-ink-faint transition-colors hover:text-ink"
      >
        <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden="true">
          <path
            d="m3 3 8 8M11 3l-8 8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo<ToastApi>(() => {
    const push = (tone: Tone) => (message: string) =>
      setToasts((current) => [
        ...current.slice(-2),
        { id: Date.now() + Math.floor(performance.now()), tone, message },
      ]);

    return { success: push('success'), error: push('error') };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ul className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <ToastRow key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </ul>
    </ToastContext.Provider>
  );
};
