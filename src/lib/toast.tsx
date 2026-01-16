import { toast as sonnerToast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

/**
 * Standardized toast notifications with icons
 * Provides consistent styling and messaging across the application
 */

interface ToastOptions {
  duration?: number;
  description?: string;
}

export const toast = {
  /**
   * Success toast with checkmark icon
   */
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
      icon: <CheckCircle2 className="h-5 w-5" />,
    });
  },

  /**
   * Error toast with X icon
   */
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      duration: options?.duration ?? 5000,
      description: options?.description,
      icon: <XCircle className="h-5 w-5" />,
    });
  },

  /**
   * Warning toast with alert icon
   */
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      duration: options?.duration ?? 4500,
      description: options?.description,
      icon: <AlertTriangle className="h-5 w-5" />,
    });
  },

  /**
   * Info toast with info icon
   */
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
      icon: <Info className="h-5 w-5" />,
    });
  },

  /**
   * Loading toast (for long operations)
   */
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};
