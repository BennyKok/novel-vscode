import { commands, ExtensionContext, window, WebviewPanelSerializer, WebviewPanel } from "vscode";
import { NovelEditorPanel } from "./panels/NovelEditorPanel";

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  const novelCommand = commands.registerCommand("extension.previewMarkdown", async () => {
    const editor = window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      NovelEditorPanel.render(context.extensionUri, document.uri);
    }
  });

  // Add command to the extension context
  context.subscriptions.push(novelCommand);
  window.registerWebviewPanelSerializer("markdownPreview", new MarkdownSerializer());
}

class MarkdownSerializer implements WebviewPanelSerializer {
  async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
    // `state` is the state persisted using `setState` method.
    // Restore `webviewPanel.webview.html` and other state here.
    NovelEditorPanel.revive(webviewPanel, state);
  }
}
