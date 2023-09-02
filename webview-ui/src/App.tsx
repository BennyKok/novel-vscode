import { vscode } from "./utilities/vscode";
import { Editor } from "novel";
import { useEffect, useState } from "react";
import type { Uri } from "vscode";
import "./App.css";
import { ThemeProvider } from "next-themes";

function App() {
  const defaultState = vscode.getState() as { content: string; uri: any; isDarkTheme: boolean };

  const [content, setContent] = useState<string | undefined>(defaultState?.content);
  // const [content, setContent] = useState<string | undefined>("hi");
  const [targetUri, setUri] = useState<Uri>(defaultState?.uri);

  const [theme, setTheme] = useState(
    defaultState == undefined || defaultState.isDarkTheme ? "dark" : "light"
  );

  useEffect(() => {
    const event = (event: any) => {
      const message = event.data;

      switch (message.type) {
        case "revive":
          // clear cache
          localStorage.removeItem("novel__content");
          setContent(message.value);
          setUri(message.uri);
          setTheme(message.isDarkTheme ? "dark" : "light");
          vscode.setState({
            content: message.value,
            uri: message.uri,
            isDarkTheme: message.isDarkTheme,
          });
          // localStorage.setItem('novel-editor', message.value)
          // console.log(message.uri);
          break;
        case "theme":
          setTheme(message.isDarkTheme ? "dark" : "light");
          break;
      }
    };
    window.addEventListener("message", event);
    return () => window.removeEventListener("message", event);
  }, []);

  return (
    <ThemeProvider
      forcedTheme={theme}
      attribute="class"
      defaultTheme="dark"
      value={{
        light: "light-theme",
        dark: "dark-theme",
      }}>
      <main>
        {content && (
          <Editor
            defaultValue={content}
            onDebouncedUpdate={(editor) => {
              if (!editor) return;

              vscode.postMessage({
                command: "update",
                text: editor.storage.markdown.getMarkdown(),
                uri: targetUri,
              });
            }}
          />
        )}
      </main>
    </ThemeProvider>
  );
}

export default App;
