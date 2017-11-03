'use strict';
/* global console, process */
/* eslint-disable no-console */
import * as vscode from 'vscode';
import * as path from 'path';

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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('activate runInTerminal');


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

        if (!isMatch(matchPattern, editor.document.fileName)) {
            console.log(`abort runCommand: ${editor.document.fileName} did not match ${matchPattern}`);
            return;
        }
        command = buildCommand(editor, command);

        // Display a message box to the user
        vscode.window.showInformationMessage(`runInTerminal(matchPattern: ${matchPattern}, command: "${command}" )`);

    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('runInTerminal.run', (args?: Array<string>) => {
        var editor = vscode.window.activeTextEditor
        runCommand(editor, args);

    });
    context.subscriptions.push(disposable);


}

// this method is called when your extension is deactivated
export function deactivate() {
}