'use strict';
/* global console, process */
/* eslint-disable no-console */
import * as vscode from 'vscode';
import * as path from 'path';

interface Args {
  // eslint-disable-line no-undef
  name?: string; // eslint-disable-line no-undef
  match?: string; // eslint-disable-line no-undef
  cmd?: string; // eslint-disable-line no-undef
}

var LAST_COMMAND: Args | null = null;

// Static class that creates and holds a reference to a terminal and can run commands in it.
class Term {
  static termName: string = 'run-in-terminal'; // eslint-disable-line no-undef
  static term: vscode.Terminal; // eslint-disable-line no-undef
  static processId: number; // eslint-disable-line no-undef

  static _term() {
    if (!Term.term) {
      Term.term = vscode.window.createTerminal(Term.termName);
      Term.term.show(true);
      Term.term.processId.then((procId) => {
        Term.processId = procId;
      });

      // if user closes the terminal, delete our reference:
      vscode.window.onDidCloseTerminal((event) => {
        event.processId.then((procId) => {
          if (procId == Term.processId) {
            Term.term = undefined;
            Term.processId = undefined;
          }
        });
      });
    }
    return Term.term;
  }

  static run(command: string) {
    console.log(`Running ${command} in ${JSON.stringify(Term._term())}`);
    Term._term().sendText(command, true);
  }

  static dispose() {
    if (Term._term()) {
      Term._term().dispose();
      Term.term = undefined;
    }
  }
}

class Cmd {
  name: string | null; // eslint-disable-line no-undef
  match: string | null; // eslint-disable-line no-undef
  cmd: string | null; // eslint-disable-line no-undef
  editor: vscode.TextEditor; // eslint-disable-line no-undef
  config: vscode.WorkspaceConfiguration; // eslint-disable-line no-undef

  constructor(
    editor: vscode.TextEditor,
    config: vscode.WorkspaceConfiguration,
    name?: string,
    match?: string,
    cmd?: string
  ) {
    this.name = name || null;
    this.match = match || null;
    this.cmd = cmd || null;
    this.editor = editor;
    this.config = config;
  }

  private isMatch(pattern: string): boolean {
    try {
      return pattern.length > 0 && new RegExp(pattern).test(this.editor.document.fileName);
    } catch (e) {
      console.log(e.stack);
      showError(`invalid match pattern: ${pattern}`);
      return false;
    }
  }

  public findCmd(): string | undefined {
    console.log('findCmd this.match', this.match, 'this.cmd', this.cmd, 'this.name', this.name);
    if (this.match && this.cmd && this.isMatch(this.match)) {
      return this.cmd;
    } else if (this.name) {
      var that = this;
      var all = this.config.inspect('commands');
      var finder = (c: Args) => {
        console.log('find', JSON.stringify(c), 'c.cmd', `${c.cmd}`);
        return c.name == that.name && that.isMatch(c.match) && `${c.cmd}` != '';
      };
      // look through commands configurations from most specific to least.
      // precedence defined at: https://code.visualstudio.com/api/references/vscode-api#WorkspaceConfiguration
      var needle =
        ((all.workspaceFolderValue || []) as Args[]).find(finder) ||
        ((all.workspaceValue || []) as Args[]).find(finder) ||
        ((all.globalValue || []) as Args[]).find(finder) ||
        ((all.defaultValue || []) as Args[]).find(finder);
      if (needle) {
        return needle.cmd;
      }
    }
    return undefined;
  }

  public build(command: string): string {
    var extName = path.extname(this.editor.document.fileName);
    var relativeFile = '.' + this.editor.document.fileName.replace(vscode.workspace.rootPath, '');
    var line = this.editor.selection.active.line + 1;
    var column = this.editor.selection.active.character + 1;

    command = command.replace(/\${line}/g, `${line}`);
    command = command.replace(/\${column}/g, `${column}`);
    command = command.replace(/\${relativeFile}/g, relativeFile);
    command = command.replace(/\${file}/g, `${this.editor.document.fileName}`);
    command = command.replace(/\${workspaceRoot}/g, `${vscode.workspace.rootPath}`);
    command = command.replace(
      /\${fileBasename}/g,
      `${path.basename(this.editor.document.fileName)}`
    );
    command = command.replace(/\${fileDirname}/g, `${path.dirname(this.editor.document.fileName)}`);
    command = command.replace(/\${fileExtname}/g, `${extName}`);
    command = command.replace(
      /\${fileBasenameNoExt}/g,
      `${path.basename(this.editor.document.fileName, extName)}`
    );
    command = command.replace(/\${cwd}/g, `${process.cwd()}`);

    if (this.config.get('saveCommandInHistory')) {
      command = this.config.get('clearBeforeRun') ? `clear; ${command}` : command;
    } else {
      command = this.config.get('clearBeforeRun') ? ` clear; ${command}` : ` ${command}`;
    }

    // replace environment variables ${env.Name}
    command = command.replace(/\${env\.([^}]+)}/g, (sub, envName) => {
      return process.env[envName];
    });

    return command;
  }
}

export function isMatch(pattern: string, fileName: string): boolean {
  console.log('isMatch pattern', pattern, 'fileName', fileName);
  try {
    return pattern.length > 0 && new RegExp(pattern).test(fileName);
  } catch (e) {
    console.log(e.stack);
    showError(`invalid match pattern: ${pattern}`);
    return false;
  }
}

function showError(msg: string): void {
  vscode.window.showErrorMessage(`run-in-terminal: ${msg}`);
}

function runCommand(editor: vscode.TextEditor, args?: Args) {
  if (!editor) {
    console.log('run-in-terminal: no editor.');
    return;
  }
  if (!args) {
    console.log('run-in-terminal: no args.');
    return;
  }
  var a: Args = args;
  LAST_COMMAND = a;
  console.log(`run-int-terminal: ${JSON.stringify(a)}`);

  var cfg = vscode.workspace.getConfiguration('runInTerminal');
  console.log('inspect', JSON.stringify(cfg.inspect('commands')));
  var cmd = new Cmd(editor, cfg, a.name, a.match, a.cmd);
  var cmdStr = cmd.findCmd();

  if (!cmdStr) {
    console.log(`run-in-terminal: no command found for args: ${JSON.stringify(a)}`);
    return;
  }
  Term.run(cmd.build(cmdStr));
}

// vscode.extensions API
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('activate runInTerminal');

  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('runInTerminal.run', (args?: Args) => {
    runCommand(vscode.window.activeTextEditor, args);
  });
  context.subscriptions.push(disposable);

  // The commandId parameter must match the command field in package.json
  disposable = vscode.commands.registerCommand('runInTerminal.runLast', () => {
    if (LAST_COMMAND) {
      runCommand(vscode.window.activeTextEditor, LAST_COMMAND);
    }
  });
  context.subscriptions.push(disposable);
}

// vscode.extensions API
export function deactivate() {
  Term.dispose();
}
