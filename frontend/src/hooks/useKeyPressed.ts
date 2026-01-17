import { useEffect, useCallback } from 'react';

type KeyHandler = () => void;

interface KeyBinding {
  key: string;
  handler: KeyHandler;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
  // Don't trigger if user is typing in an input
  ignoreInputs?: boolean;
}

interface UseKeyPressedConfig {
  bindings: KeyBinding[];
  enabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts with configurable key bindings.
 *
 * @example
 * // Basic usage - Escape to go back
 * useKeyPressed({
 *   bindings: [
 *     { key: 'Escape', handler: handleBack },
 *   ]
 * });
 *
 * @example
 * // With modifiers - Ctrl+Enter to submit
 * useKeyPressed({
 *   bindings: [
 *     { key: 'Enter', ctrl: true, handler: handleSubmit, preventDefault: true },
 *     { key: 'Escape', handler: handleCancel },
 *   ]
 * });
 *
 * @example
 * // Conditionally enabled
 * useKeyPressed({
 *   bindings: [{ key: 'r', handler: startReply }],
 *   enabled: !isReplying
 * });
 */
export const useKeyPressed = ({ bindings, enabled = true }: UseKeyPressedConfig): void => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      for (const binding of bindings) {
        // Check if we should ignore this because user is typing in an input
        if (binding.ignoreInputs !== false) {
          const target = event.target as HTMLElement;
          const tagName = target.tagName.toLowerCase();
          const isInput = tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
          if (isInput) continue;
        }

        const ctrlMatches = binding.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = binding.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = binding.alt ? event.altKey : !event.altKey;

        const keyMatches = event.key === binding.key || event.code === binding.key;
        if (!keyMatches) continue;

        const metaMatches = binding.meta ? event.metaKey : true;

        if (ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (binding.preventDefault) {
            event.preventDefault();
          }
          binding.handler();
          return;
        }
      }
    },
    [bindings, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

// Common key binding presets
export const KeyBindings = {
  escape: (handler: KeyHandler): KeyBinding => ({
    key: 'Escape',
    handler,
    ignoreInputs: false, // Escape should work even in inputs
  }),

  ctrlEnter: (handler: KeyHandler): KeyBinding => ({
    key: 'Enter',
    ctrl: true,
    handler,
    preventDefault: true,
    ignoreInputs: false, // Should work in textareas
  }),

  arrowUp: (handler: KeyHandler): KeyBinding => ({
    key: 'ArrowUp',
    handler,
    ignoreInputs: true,
  }),

  arrowDown: (handler: KeyHandler): KeyBinding => ({
    key: 'ArrowDown',
    handler,
    ignoreInputs: true,
  }),

  reply: (handler: KeyHandler): KeyBinding => ({
    key: 'r',
    handler,
    ignoreInputs: true,
  }),

  newConversation: (handler: KeyHandler): KeyBinding => ({
    key: 'N',
    shift: true,
    handler,
    ignoreInputs: true,
  }),

  search: (handler: KeyHandler): KeyBinding => ({
    key: '/',
    handler,
    preventDefault: true,
    ignoreInputs: true,
  }),

  goBack: (handler: KeyHandler): KeyBinding => ({
    key: 'Backspace',
    handler,
    ignoreInputs: true,
  }),
};
