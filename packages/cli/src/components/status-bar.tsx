import { theme } from "../theme";

export function StatusBar() {
  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      width="100%"
      height={1}
      paddingX={2}
    >
      <text fg={theme.muted}>? for shortcuts</text>
      <text fg={theme.muted}>opus 4.6</text>
    </box>
  );
}
