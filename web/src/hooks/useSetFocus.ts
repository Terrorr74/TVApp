import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'

/** Returns the programmatic setFocus function from the norigin spatial nav singleton. */
export function useSetFocus() {
  const { setFocus } = useFocusable()
  return setFocus
}
