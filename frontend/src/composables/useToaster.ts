import { inject, type Ref } from 'vue';

export interface ToasterInstance {
  show: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useToaster() {
  const toasterRef = inject<Ref<ToasterInstance | null>>('toaster');

  const toast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    toasterRef?.value?.show(message, type);
  };

  return {
    toast,
    success: (message: string) => toast(message, 'success'),
    error: (message: string) => toast(message, 'error'),
    warning: (message: string) => toast(message, 'warning'),
    info: (message: string) => toast(message, 'info'),
  };
}
