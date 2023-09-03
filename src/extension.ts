import {
  ExtensionContext,
  window,
  WebviewPanelSerializer,
  WebviewPanel,
  commands,
  Uri,
} from "vscode";
import { NovelEditorPanel } from "./panels/NovelEditorPanel";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(NovelEditorPanel.register(context));
  context.subscriptions.push(
    commands.registerCommand("novel.editWith", async () => {
      const editor = window.activeTextEditor;
      if (!editor) {
        return;
      }
      await commands.executeCommand("vscode.openWith", editor.document.uri, NovelEditorPanel.viewType);
    })
  );
}
