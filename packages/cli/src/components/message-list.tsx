import { theme } from "../theme";

export type Message = {
  role: "user" | "assistant";
  text: string;
};

export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <box flexDirection="column" gap={1}>
      {messages.map((m, i) =>
        m.role === "user" ? (
          <box key={i} flexDirection="row">
            <text fg={theme.muted}>{"> "}</text>
            <text fg={theme.user}>{m.text}</text>
          </box>
        ) : (
          <box key={i} flexDirection="row">
            <text fg={theme.accent}>{"● "}</text>
            <text fg={theme.text}>{m.text}</text>
          </box>
        ),
      )}
    </box>
  );
}
