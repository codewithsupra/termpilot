import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { useState } from "react";
import { Header } from "./components/header";
import { InputBar } from "./components/input-bar";
import { MessageList, type Message } from "./components/message-list";
import { StatusBar } from "./components/status-bar";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSubmit = (value: string) => {
    // TODO: send `value` to the agent and append its reply
    setMessages((prev) => [...prev, { role: "user", text: value }]);
  };

  return (
    <box flexDirection="column" flexGrow={1} paddingX={1}>
      <scrollbox flexGrow={1} stickyScroll stickyStart="bottom">
        <Header />
        <MessageList messages={messages} />
      </scrollbox>

      <InputBar onSubmit={handleSubmit} />
      <StatusBar />
    </box>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
