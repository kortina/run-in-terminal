'use strict';
/* global console, process */
/* eslint-disable no-console */
import * as vscode from 'vscode';
import * as path from 'path';

interface Command { // eslint-disable-line no-undef
    name?: string; // eslint-disable-line no-undef
    match?: string; // eslint-disable-line no-undef
    cmd?: string; // eslint-disable-line no-undef
}

var LAST_COMMAND: Command | null = null

// Static class that creates and holds a reference to a terminal and can run commands in it.
class Term {
    static termName: string = 'run-in-terminal'; // eslint-disable-line no-undef
    static term: vscode.Terminal; // eslint-disable-line no-undef

    static _term() {
        if (!Term.term) {
            Term.term = vscode.window.createTerminal(Term.termName);
            Term.term.show(true);

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

export function isValidRegex(pattern: string): boolean {
    try {
        new RegExp(pattern);
        return true;
    } catch (e) {
        console.log(e.stack);
        return false;
    }
}

export function isMatch(pattern: string, fileName: string): boolean {
    try {
        return pattern.length > 0 && new RegExp(pattern).test(fileName)
    } catch (e) {
        console.log(e.stack);
        showError(`invalid match pattern: ${pattern}`);
        return false;
    }
}

// lookup command by cmd.name
// or fallback to using cmd.match and cmd.cmd
export function findCommand(fileName: string, name: string): Command {
    var commands: Array<Command> = vscode.workspace.getConfiguration('runInTerminal').get('commands') || [];
    return commands.find(c => c.name == name && isMatch(c.match, fileName) && `${c.cmd}` != '')
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

    command = vscode.workspace.getConfiguration('runInTerminal.clearBeforeRun') ? ` clear; ${command}` : ` ${command}`
    // replace environment variables ${env.Name}
    command = command.replace(/\${env\.([^}]+)}/g, (sub, envName) => {
        return process.env[envName]
    })

    return command;
}

function showError(msg: string):void {
    vscode.window.showErrorMessage(`run-in-terminal: ${msg}`);
}

function runCommand(editor: vscode.TextEditor, args?: Array<Command>) {
    if (!editor) {
        console.log("run-in-terminal: no editor.");
        return;
    }
    if (!args || !args[0]) {
        console.log("run-in-terminal: no args.");
        return;

    }
    ////////////////////
    // parse args
    ////////////////////
    var c:Command = args[0];
    LAST_COMMAND = c;
    console.log(`run-int-terminal: ${JSON.stringify(c)}`);

    var command: Command | undefined;
    if (c.match && c.cmd && isMatch(c.match, editor.document.fileName)) {
        command = c;
    } else if (c.name) {
        command = findCommand(editor.document.fileName, c.name);
    }
    if (!command) {
        console.log(`run-in-terminal: no command found for args: ${JSON.stringify(c)}`);
        return;
    }
    Term.run(
        buildCommand(editor, command.cmd)
    );

}


// vscode.extensions API
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('activate runInTerminal');


    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('runInTerminal.run', (args?: Array<Command>) => {
        runCommand(vscode.window.activeTextEditor, args);
    });
    context.subscriptions.push(disposable);

    // The commandId parameter must match the command field in package.json
    disposable = vscode.commands.registerCommand('runInTerminal.runLast', () => {
        if (LAST_COMMAND) {
            runCommand(vscode.window.activeTextEditor, [LAST_COMMAND]);
        }
    });
    context.subscriptions.push(disposable);


}

// vscode.extensions API
export function deactivate() {
    Term.dispose();
}