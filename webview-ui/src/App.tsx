import { vscode } from "./utilities/vscode";
import { Editor } from "novel";
import { useEffect, useRef, useState } from "react";
import type { Uri } from "vscode";
import "./App.css";
import { ThemeProvider } from "next-themes";
import { Markdown } from "tiptap-markdown";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { Extension } from '@tiptap/core';
import markdownitContainer from "markdown-it-container";

type UpdateFunctionProps = NonNullable<Parameters<typeof Editor>[0]["onUpdate"]>;
type EditorType = Parameters<UpdateFunctionProps>[0];

function App() {
  const defaultState = vscode.getState() as { content: string; uri: any; isDarkTheme: boolean };

  const [content, setContent] = useState<string | undefined>(defaultState?.content);
  // const [content, setContent] = useState<string | undefined>("hi");
  const [targetUri, setUri] = useState<Uri>(defaultState?.uri);

  const [theme, setTheme] = useState(
    defaultState == undefined || defaultState.isDarkTheme ? "dark" : "light"
  );

  const editorRef = useRef<EditorType | null>(null);

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

          if (editorRef.current) {
            editorRef.current.commands.setContent(message.value, false);
          }
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
            extensions={[
              Table.configure({
                resizable: true,
                lastColumnResizable: true,
              }),
              TableRow.configure({
                HTMLAttributes: {
                  style: 'border-bottom: 1px solid;'
                }
              }),
              TableHeader.configure({
                HTMLAttributes: {
                  style: 'border-bottom: 1px solid;'
                }
              }),
              TableCell,
              // Container,
              Markdown.configure({
                html: true,
                transformCopiedText: true,
                transformPastedText: true,
              }),
            ]}
            // editorProps={{
            //   handlePaste: (view, event, slice) => {
            //     console.log(event, slice);
            //     return false;
            //   },
            // }}
            defaultValue={content}
            onUpdate={(editor) => {
              editorRef.current = editor;

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
