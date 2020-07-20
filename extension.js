// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const loginHandler = require('./utils/loginHandler')
const snippets = require('./utils/snippets')
const config = require('./utils/config')
const languages = require('./utils/languages')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const handleSnippetCreation = async (editor, ctx) => {
  const selection = editor.selection
  const content = editor.document.getText(selection)

  const syntax = editor.document.languageId === 'plaintext' ? 'plain' : editor.document.languageId
  const filteredLanguages = languages.filter(l => l.value === syntax)
  let topic = filteredLanguages.length ? filteredLanguages[0].name : syntax
  let title = ''
  if (syntax === 'plain') {
    do {
      topic = await vscode.window.showInputBox({
        prompt: 'Topic',
        placeHolder: 'This snippet is about...',
      })
    } while (typeof topic === 'string' && !topic.trim())
  }
  do {
    title = await vscode.window.showInputBox({
      prompt: 'Snippet Title (Required)',
      placeHolder: 'I just learned how to...',
    })
  } while (typeof title === 'string' && !title.trim())

  if (title) {
    const source = await vscode.window.showInputBox({
      prompt: 'Source (Optional)',
      placeHolder: 'From',
    })

    try {
      const accessToken = loginHandler.accessToken(ctx)
      await snippets.create({ title, syntax, content, source, topic }, accessToken)
      vscode.window
        .showInformationMessage(
          'Success! Your new snippet has been created!',
          'Convert it to a flashcard',
        )
        .then(r => {
          if (r === 'Convert it to a flashcard')
            vscode.env.openExternal(vscode.Uri.parse(`${config.baseUrl}snippets/process`))
        })
    } catch (e) {
      vscode.window.showErrorMessage('Oops. Looks like something went wrong. Please try again.')
    }
  }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('extension.createSnippet', async () => {
    const editor = vscode.window.activeTextEditor

    const selection = editor.selection
    const content = editor.document.getText(selection)

    if (!content) {
      vscode.window.showErrorMessage('Please select the text that you want to create as a snippet')
      return
    }
    let isLoggedIn = loginHandler.accessToken(context)
    if (!isLoggedIn) {
      const authToken = await vscode.window.showInputBox({
        prompt: 'Please login to continue',
        placeHolder: 'Paste your magic token here',
      })

      if (!authToken) {
        vscode.window.showInformationMessage("Don't have a token?", 'Get your token').then(r => {
          if (r === 'Get your token') vscode.env.openExternal(vscode.Uri.parse(`${config.baseUrl}?s=extension`))
        })
        return
      }
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Logging in...',
        },
        async (progress, token) => {
          try {
            await loginHandler.login(authToken, context)
            progress.report({
              increment: 100,
              message: 'Logged in successfully!',
            })
            handleSnippetCreation(editor, context)
          } catch (e) {
            progress.report({
              increment: 100,
              message: 'Logging in failed. Please try again.',
            })
            vscode.window
              .showInformationMessage("Logging in failed. Don't have a token?", 'Get your token')
              .then(r => {
                if (r === 'Get your token')
                  vscode.env.openExternal(vscode.Uri.parse(`${config.baseUrl}?s=extension`))
              })
          }
        },
      )
      return
    }
    handleSnippetCreation(editor, context)
  })

  let logoutCommand = vscode.commands.registerCommand('extension.logout', async () => {
    loginHandler.logout(context)
    vscode.window.showInformationMessage("You've been logged out of mem.dev")
  })

  context.subscriptions.push(disposable)
  context.subscriptions.push(logoutCommand)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
}
