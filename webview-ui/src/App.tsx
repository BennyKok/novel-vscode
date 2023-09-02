import { vscode } from "./utilities/vscode";
import { Editor } from "novel";
import { useEffect, useState } from "react";
import { Uri } from "vscode";
import "./App.css"

function App() {
  const defaultState = vscode.getState() as { content: string; uri: any };

  const [content, setContent] = useState<string | undefined>(defaultState?.content);
  // const [content, setContent] = useState<string | undefined>("hi");
  const [targetUri, setUri] = useState<Uri>(defaultState?.uri);

  useEffect(() => {
    const event = (event: any) => {
      const message = event.data;

      switch (message.type) {
        case "revive":
          console.log("revive", event.data);
          
          // clear cache
          localStorage.removeItem('novel__content')
          setContent(message.value);
          setUri(message.uri);
          vscode.setState({
            content: message.value,
            uri: message.uri,
          });
          // localStorage.setItem('novel-editor', message.value)
          console.log(message.uri);
          break;
      }
    };
    window.addEventListener("message", event);
    return () => window.removeEventListener("message", event);
  }, []);

  return (
    <main>
      {content && <Editor
        defaultValue={content}
        onDebouncedUpdate={(editor) => {
          if (!editor) return;

          vscode.postMessage({
            command: "update",
            text: editor.storage.markdown.getMarkdown(),
            uri: targetUri,
          });
        }}
      />}
    </main>
  );
}

export default App;
