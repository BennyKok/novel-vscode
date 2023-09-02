import {
  Disposable,
  Webview,
  WebviewPanel,
  window,
  Uri,
  ViewColumn,
  ColorThemeKind,
  ColorTheme,
} from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { Range, Position, workspace } from "vscode";
/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class NovelEditorPanel {
  public static currentPanel: NovelEditorPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  /**
   * The HelloWorldPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);

    this._disposables.push(
      window.onDidChangeActiveColorTheme((e: ColorTheme) => {
        let isDarkTheme = e.kind === ColorThemeKind.Dark;
        this._panel.webview.postMessage({ type: "theme", isDarkTheme: isDarkTheme });
      })
    );
  }
  
  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static async render(extensionUri: Uri, contentUri: Uri) {
    if (NovelEditorPanel.currentPanel) {
      // If the webview panel already exists reveal it
      NovelEditorPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "markdownPreview",
        "Markdown Preview",
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [
            Uri.joinPath(extensionUri, "out"),
            Uri.joinPath(extensionUri, "webview-ui/build"),
          ],
        }
      );

      NovelEditorPanel.currentPanel = new NovelEditorPanel(panel, extensionUri);
    }

    let currentTheme = window.activeColorTheme;
    let isDarkTheme = currentTheme.kind === ColorThemeKind.Dark;

    const content = await workspace.fs.readFile(contentUri);
    NovelEditorPanel.currentPanel._panel.webview.postMessage({
      type: "revive",
      value: content.toString(),
      uri: contentUri,
      isDarkTheme: isDarkTheme,
    });
  }

  public static revive(panel: WebviewPanel, state: any) {
    // console.log("revive something", state);

    // panel.webview.html = this.getWebviewContent(state.content);
    panel.webview.postMessage({ type: "revive", value: state.content });
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    NovelEditorPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
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

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "hello":
            // Code that should run in response to the hello message command
            window.showInformationMessage(text);
            return;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
          case "update":
            const uri = message.uri as Uri;
            const encoder = new TextEncoder(); // This comes from the 'util' module in Node.js
            const data = encoder.encode(text);

            console.log(uri);

            workspace.fs.writeFile(uri, data).then(() => {
              window.showInformationMessage(`Successfully wrote to ${uri.path}`);
            });
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}
