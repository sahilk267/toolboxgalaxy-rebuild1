/**
 * Window-level puzzle shortcuts must not hijack typing, navigation, other
 * controls, accessible dialogs, or browser/system keyboard combinations.
 * On-screen puzzle buttons still work via their own click handlers.
 */
export function shouldIgnorePuzzleKey(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing || event.repeat ||
      event.ctrlKey || event.metaKey || event.altKey ||
      (typeof document !== "undefined" && document.hidden)) return true;
  const target = event.target;
  if (target instanceof HTMLElement) {
    if (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) ||
        target.closest('[contenteditable="true"],[role="textbox"],[role="dialog"],[aria-modal="true"],[data-slot="dialog-content"]')) return true;
  }
  return Boolean(document.querySelector('[aria-modal="true"],[data-slot="dialog-content"]'));
}
