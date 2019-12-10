// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const loginHandler = require("./utils/loginHandler");
const snippets = require("./utils/snippets");
const config = require("./utils/config");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.createSnippet",
    async a => {
      const editor = vscode.window.activeTextEditor;

      const selection = editor.selection;
      const content = editor.document.getText(selection);

      if (!content) {
        vscode.window.showErrorMessage(
          "Please select the text that you want to create as a snippet"
        );
        return;
      }

      const isLoggedIn = await loginHandler.accessToken();

      if (!isLoggedIn) {
        const authToken = await vscode.window.showInputBox({
          prompt: "Please login to continue",
          placeHolder: "Paste your magic token here"
        });

        if (!authToken) {
          vscode.window
            .showInformationMessage("Don't have a token?", "Get your token")
            .then(r => {
              if (r === "Get your token")
                vscode.env.openExternal(vscode.Uri.parse(config.baseUrl));
            });
          return;
        }

        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Logging in..."
          },
          async (progress, token) => {
            try {
              await loginHandler.login(authToken);
              progress.report({
                increment: 100,
                message: "Logged in successfully!"
              });
            } catch (e) {
              progress.report({
                increment: 100,
                message: "Logging in failed. Please try again."
              });
              vscode.window
                .showInformationMessage("Don't have a token?", "Get your token")
                .then(r => {
                  if (r === "Get your token")
                    vscode.env.openExternal(vscode.Uri.parse(config.baseUrl));
                });
            }
          }
        );
      }
      const syntax =
        editor.document.languageId === "plaintext"
          ? "plain"
          : editor.document.languageId;
      let title = "";
      do {
        title = await vscode.window.showInputBox({
          prompt: "Snippet Title (Required)",
          placeHolder: "I just learned how to..."
        });
      } while (!title.trim());
      const source = await vscode.window.showInputBox({
        prompt: "Source (Optional)",
        placeHolder: "From"
      });

      try {
        const accessToken = await loginHandler.accessToken();
        const res = await snippets.create(
          { title, syntax, content, source, topic: syntax },
          accessToken
        );
        vscode.window
          .showInformationMessage(
            "Success! Your new snippet has been created!",
            "Convert it to a flashcard"
          )
          .then(r => {
            if (r === "Convert it to a flashcard")
              vscode.env.openExternal(
                vscode.Uri.parse(`${config.baseUrl}snippets/process`)
              );
          });
      } catch (e) {
        console.log(e);
      }
    }
  );

  context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
