import { theme } from "../theme";

export function Header() {
  return (
    <box
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={theme.accent}
      paddingX={1}
      alignSelf="flex-start"
      marginBottom={1}
    >
      <text>
        <span fg={theme.accent}>✻</span> Welcome to <b>nightcode</b>!
      </text>
      <text fg={theme.muted}> </text>
      <text fg={theme.muted}>  /help for help, /status for your current setup</text>
      <text fg={theme.muted}> </text>
      <text fg={theme.muted}>  cwd: {process.cwd()}</text>
    </box>
  );
}
