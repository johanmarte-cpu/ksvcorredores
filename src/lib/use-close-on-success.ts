import { useState } from "react";

// Closes a dialog after a server action succeeds, following React's
// "adjust state while rendering" pattern instead of a useEffect side effect.
export function useCloseDialogOnSuccess(
  state: { success?: boolean } | undefined,
  setOpen: (open: boolean) => void,
) {
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.success) setOpen(false);
  }
}
