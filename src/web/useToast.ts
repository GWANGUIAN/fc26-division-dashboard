import { useEffect, useRef, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<string>();
  const toastTimeout = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(toastTimeout.current), []);
  function showToast(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(undefined), 2200);
  }
  return { toast, showToast };
}
