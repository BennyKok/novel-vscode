import {
  Disposable,
  Webview,
  WebviewPanel,
  window,
  Uri,
  ColorThemeKind,
  ColorTheme,
  CustomTextEditorProvider,
  CancellationToken,
  TextDocument,
  ExtensionContext,
  WorkspaceEdit,
} from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { Range, Position, workspace } from "vscode";

export class NovelEditorPanel implements CustomTextEditorProvider {
  public static register(context: ExtensionContext): Disposable {
    const provider = new NovelEditorPanel(context);
    const providerRegistration = window.registerCustomEditorProvider(
      NovelEditorPanel.viewType,
      provider, {
        supportsMultipleEditorsPerDocument: false,
      }
    );
    return providerRegistration;
  }

  public static readonly viewType = "novel.editMarkdown";

  constructor(private readonly context: ExtensionContext) {}

  resolveCustomTextEditor(
    document: TextDocument,
    webviewPanel: WebviewPanel,
    token: CancellationToken
  ): void | Thenable<void> {
    const extensionUri = this.context.extensionUri;

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        Uri.joinPath(extensionUri, "out"),
        Uri.joinPath(extensionUri, "webview-ui/build"),
      ],
    };
    webviewPanel.webview.html = NovelEditorPanel.getWebviewContent(
      webviewPanel.webview,
      extensionUri
    );

    const disposables: Disposable[] = [];

    let isUpdating = {
      creationTime: Date.now(),
      current: false,
      editTime: undefined
    };

    workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          if (!isUpdating.current) {
            console.log("update window", isUpdating);
            // NovelEditorPanel.updateWindow(webviewPanel, e.document);
          } else {
            isUpdating.current = false;
          }
        }
      },
      undefined,
      disposables
    );
    window.onDidChangeActiveColorTheme(
      (e: ColorTheme) => {
        let isDarkTheme = e.kind === ColorThemeKind.Dark;
        webviewPanel.webview.postMessage({ type: "theme", isDarkTheme: isDarkTheme });
      },
      undefined,
      disposables
    );
    webviewPanel.webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
          case "update":
            const edit = new WorkspaceEdit();
            isUpdating.current = true;
            // @ts-ignore
            isUpdating.editTime = Date.now();

            console.log('update', message.uri, text);
            // Just replace the entire document every time for this example extension.
            // A more complete extension should compute minimal edits instead.
            edit.replace(message.uri, new Range(0, 0, document.lineCount, 0), text);
            workspace.applyEdit(edit).then(() => {
              // window.showInformationMessage(`Successfully wrote to ${uri.path}`);
            });
        }
      },
      undefined,
      disposables
    );

    webviewPanel.onDidDispose(() => {
      while (disposables.length) {
        const disposable = disposables.pop();
        if (disposable) {
          disposable.dispose();
        }
      }
    });

    NovelEditorPanel.updateWindow(webviewPanel, document);
  }

  static async updateWindow(panel: WebviewPanel, document: TextDocument) {
    let currentTheme = window.activeColorTheme;
    let isDarkTheme = currentTheme.kind === ColorThemeKind.Dark;

    // const content = await workspace.fs.readFile(contentUri);
    panel.webview.postMessage({
      type: "revive",
      value: document.getText(),
      uri: document.uri,
      isDarkTheme: isDarkTheme,
    });
  }

  static getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);
    // const scriptUri2 = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "Live2DAvatarLoader-2GUNJWES.js"]);
    const nonce = getNonce();
    // removing this cause causing the style sheet not loading properly
    // <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
