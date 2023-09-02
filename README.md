# [novel](https://github.com/steven-tey/novel)-vscode

A vscode extension for [novel](https://github.com/steven-tey/novel)

Based on [hello-world-react-vite](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-vite) for vscode

## Features

- Edit markdown file directly in vscode with novel editor `[ctrl/cmd]+shift+p` -> `Edit Markdown with Novel`
- Debounced Auto save

## Development

```bash
# Navigate into sample directory
cd novel-vscode

# Install dependencies for both the extension and webview UI source code
pnpm install:all

# Build webview UI source code
pnpm build:webview

# Open sample in VS Code
code .
```

Once the sample is open inside VS Code you can run the extension by doing the following:

1. Press `F5` to open a new Extension Development Host window
2. Inside the host window, open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type `Edit Markdown with Novel`
