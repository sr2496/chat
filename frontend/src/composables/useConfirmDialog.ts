import { ref } from 'vue';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const isOpen = ref(false);
const options = ref<ConfirmDialogOptions>({
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
});

let resolvePromise: ((value: boolean) => void) | null = null;

export function useConfirmDialog() {
  const confirm = (opts: ConfirmDialogOptions): Promise<boolean> => {
    options.value = {
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'danger',
      ...opts,
    };
    isOpen.value = true;

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
  };

  const handleConfirm = () => {
    isOpen.value = false;
    resolvePromise?.(true);
    resolvePromise = null;
  };

  const handleCancel = () => {
    isOpen.value = false;
    resolvePromise?.(false);
    resolvePromise = null;
  };

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
