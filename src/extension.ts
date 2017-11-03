'use strict';
/* global console, process */
/* eslint-disable no-console */
import * as vscode from 'vscode';
import * as path from 'path';

// Static class that creates and holds a reference to a terminal and can run commands in it.
class Term {
    static termName: string = 'run-in-terminal'; // eslint-disable-line no-undef
    static term: vscode.Terminal; // eslint-disable-line no-undef

    static _term() {
        if (!Term.term) {
            Term.term = vscode.window.createTerminal(Term.termName);
            Term.term.show();


            // if user closes the terminal, delete our reference:
            vscode.window.onDidCloseTerminal((event) => {
                if (Term._term() && event.name === Term.termName) {
                    Term.term = undefined;
                }
            });
        }
        return Term.term;
    }

    static run(command: string) {
        console.log(`Running ${command} in ${Term._term()}`);
        Term._term().sendText(command, true);
    }

    static dispose() {
        if (Term._term()) {
            Term._term().dispose();
            Term.term = undefined;
        }
    }

}

export function isMatch(pattern: string, fileName: string): boolean {
    return pattern.length > 0 && new RegExp(pattern).test(fileName)
}

export function buildCommand(editor: vscode.TextEditor, command: string): string {
    var extName = path.extname(editor.document.fileName);
    var relativeFile = "." + editor.document.fileName.replace(vscode.workspace.rootPath, "");
    var line = editor.selection.active.line + 1;
    var column = editor.selection.active.character + 1;

    command = command.replace(/\${line}/g, `${line}`)
    command = command.replace(/\${column}/g, `${column}`)
    command = command.replace(/\${relativeFile}/g, relativeFile)
    command = command.replace(/\${file}/g, `${editor.document.fileName}`)
    command = command.replace(/\${workspaceRoot}/g, `${vscode.workspace.rootPath}`)
    command = command.replace(/\${fileBasename}/g, `${path.basename(editor.document.fileName)}`)
    command = command.replace(/\${fileDirname}/g, `${path.dirname(editor.document.fileName)}`)
    command = command.replace(/\${fileExtname}/g, `${extName}`)
    command = command.replace(/\${fileBasenameNoExt}/g, `${path.basename(editor.document.fileName, extName)}`)
    command = command.replace(/\${cwd}/g, `${process.cwd()}`)

    // replace environment variables ${env.Name}
    command = command.replace(/\${env\.([^}]+)}/g, (sub, envName) => {
        return process.env[envName]
    })

    return command;
}

function showError(msg: string):void {
    vscode.window.showErrorMessage(`run-in-terminal: ${msg}`);
}

function runCommand(editor: vscode.TextEditor, args?: Array<string>) {

    if (!editor) {
        console.log("abort runCommand: no editor.");
        return;
    }

    ////////////////////
    // parse args
    ////////////////////

    var matchPattern = '.*';
    var command = 'echo "You must pass a command to runInTerminal.run"';
    if (args && args[0]) {
        matchPattern = args[0];
    }
    if (args && args[1]) {
        command = args[1];
    }

    try {
        if (!isMatch(matchPattern, editor.document.fileName)) {
            showError(`${editor.document.fileName} did not match ${matchPattern}.`);
            return;
        }
    } catch (e) {
        console.log(e.stack);
        showError(e.message);
        return;
    }
    command = buildCommand(editor, command);

    // Display a message box to the user
    vscode.window.showInformationMessage(`runInTerminal(matchPattern: ${matchPattern}, command: "${command}" )`);
    Term.run(command);

}


// vscode.extensions API
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('activate runInTerminal');


    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('runInTerminal.run', (args?: Array<string>) => {
        console.log('disposable run');
        runCommand(vscode.window.activeTextEditor, args);

    });
    context.subscriptions.push(disposable);


}

// vscode.extensions API
export function deactivate() {
    Term.dispose();
}