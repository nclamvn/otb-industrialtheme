import { useState, useCallback, useMemo } from 'react';

export function useConfirmDialog() {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    cancelLabel: '',
    variant: 'danger',
    onConfirm: null,
  });

  const confirm = useCallback(({ title, message, confirmLabel, cancelLabel, variant, onConfirm }) => {
    setState({
      open: true,
      title: title || '',
      message: message || '',
      confirmLabel: confirmLabel || '',
      cancelLabel: cancelLabel || '',
      variant: variant || 'danger',
      onConfirm: onConfirm || null,
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm?.();
    setState(prev => ({ ...prev, open: false }));
  }, [state.onConfirm]);

  const handleCancel = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  const dialogProps = useMemo(() => ({
    open: state.open,
    title: state.title,
    message: state.message,
    confirmLabel: state.confirmLabel,
    cancelLabel: state.cancelLabel,
    variant: state.variant,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  }), [state, handleConfirm, handleCancel]);

  return { dialogProps, confirm };
}
