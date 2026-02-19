import { useState, useCallback } from 'react';

interface SnackbarProps {
  visible: boolean;
  onDismiss: () => void;
  children: string;
}

interface UseSnackbarReturn {
  show: (message: string) => void;
  hide: () => void;
  snackbarProps: SnackbarProps;
}

/**
 * useSnackbar — collapses the common 2-useState Snackbar pattern into one call.
 *
 * @example
 * const { show: showSnackbar, snackbarProps } = useSnackbar();
 * // show a message:
 * showSnackbar('Saved successfully');
 * // render:
 * <Snackbar {...snackbarProps} duration={3000} />
 */
export function useSnackbar(): UseSnackbarReturn {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return {
    show,
    hide,
    snackbarProps: {
      visible,
      onDismiss: hide,
      children: message,
    },
  };
}
