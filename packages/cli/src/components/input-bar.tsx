import type { KeyBinding, TextareaRenderable } from "@opentui/core";
import { useRef } from "react";
import { theme } from "../theme";

type InputBarProps = {
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

const keyBindings: KeyBinding[] = [
  { name: "return", action: "submit" },
  { name: "return", shift: true, action: "newline" },
];

export function InputBar({ onSubmit, disabled = false }: InputBarProps) {
  const ref = useRef<TextareaRenderable>(null);

  const handleSubmit = () => {
    const input = ref.current;
    if (!input || disabled) return;
    const value = input.plainText.trim();
    if (!value) return;
    onSubmit(value);
    input.clear();
  };

  return (
    <box
      width="100%"
      flexDirection="row"
      border
      borderStyle="rounded"
      borderColor={theme.border}
      paddingX={1}
    >
      <text fg={theme.muted}>{"> "}</text>
      <textarea
        ref={ref}
        focused={!disabled}
        flexGrow={1}
        minHeight={1}
        maxHeight={8}
        keyBindings={keyBindings}
        onSubmit={handleSubmit}
        placeholder='Try "write a test for index.tsx"'
        textColor={theme.text}
        placeholderColor={theme.muted}
      />
    </box>
  );
}
