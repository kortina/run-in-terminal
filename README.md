# Run in Terminal, an Extension for `vscode`

Use a keyboard shortcut to run any command in the Integrated Terminal of [Virtual Studio Code](https://code.visualstudio.com/).

You can [install it from the VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=kortina.run-in-terminal).

This extension is inspired by [send-to-terminal](https://github.com/malkomalko/send-to-terminal), but instead of only allowing 2 comands per filetype match, this extension allows an arbitrary number of commands per filetype.

![demo](images/run-in-terminal.gif)

## `keybindings.json`

The simplest way to configure a `keybindings.json` using the `cmd` argument for the `runInTerminal.run` command:

```
...
{
    "key": "ctrl+e",
    "command": "runInTerminal.run",
    "args": {"cmd": "/usr/bin/env bash ${relativeFile}", "match": ".*"},
    "when": "resourceLangId == shellscript" 
},
{
    "key": "ctrl+e",
    "command": "runInTerminal.run",
    "args": {"cmd": "/usr/bin/env python ${relativeFile}", "match": ".*"},
    "when": "resourceLangId == python" 
},
...
```

Note above that when using `keybindings.json` you might use the 'when' context (rather than the `match` expression) to specify different commands with the same keybinding for different filetypes. If you do so, use '.*' as your match expression.

## `settings.json`

If you are using [VSCodeVim](https://github.com/VSCodeVim/Vim), things look a little bit different, because there is no support for a 'when' context to perform different commands for different filetypes.

### 'runInTerminal.commands'

Here is what you might put in your `settings.json` when configuring with VSCodeVim:

```
...
    "vim.otherModesKeyBindingsNonRecursive": [
        {
            "before": ["<leader>", "r", "a"], "after": [],
            "commands": [ {"command": "runInTerminal.runLast" } ]
        },
        {
            "before": ["<leader>", "r", "l"], "after": [],
            "commands": [ {"command": "runInTerminal.run", "args": {"name": "l"}} ]
        },
        {
            "before": ["<leader>", "r", "b"], "after": [],
            "commands": [ {"command": "runInTerminal.run", "args": {"name": "b"}} ]
        },
        {
            "before": ["<leader>", "r", "s"], "after": [],
            "commands": [ {"command": "runInTerminal.run", "args": {"name": "s"}} ]
        }
    ],
    "runInTerminal.commands": [
        {"match": "_spec\\.rb$", "name": "l", "cmd": "./bin/rspec ${relativeFile}:${line}"},
        {"match": "_spec\\.rb$", "name": "b", "cmd": "./bin/rspec ${relativeFile}"},
        {"match": "_spec\\.rb$", "name": "s", "cmd": "./bin/rspec"},
        {"match": "(spec|test)\\.js$", "name": "b", "xvfb-run ./node_modules/karma/bin/karma start --single-run=true --single-file=\"${relativeFile}\""}
    ],
...
```

Note above, you specify each keybinding in your `vim` settings only once with a target `name`, and then in your `runInTerminal.commands`, you can specify multiple commands with the same `name` but different file `match` expressions. In this case, `<leader> r b` maps to the `name` 'b', which has a command for `ruby` and for `javascript`.

### 'runInTerminal.clearBeforeRun'

```...
    "runInTerminal.clearBeforeRun": false, // defaults false
...
```

## Substitution Tokens

You can use the following substition tokens in `cmd` strings:

* ${column}
* ${cwd}
* ${env.Name} // replace environment variables
* ${file}
* ${fileBasename}
* ${fileBasenameNoExt}
* ${fileDirname}
* ${fileExtname}
* ${line}
* ${relativeFile}
* ${workspaceRoot}

## Commands

### `runInTerminal.run`

You should provide an `object` as the value of the `arguments` key when calling this command. This object must have **either** (i) a `name` pointing to a command in `runInTerminal.commands` **or** (ii) a file `match` expression **and** `cmd` to execute.

(i) 
```...
    "command": "runInTerminal.run",
    "args": {"name": "focused"},
...
```

(ii) 
```...
    "command": "runInTerminal.run",
    "args": {"match": "\\.py$", "cmd": "/usr/bin/env python ${relativeFile}"},
...
```

### `runInTerminal.runLast`

Runs the last `cmd` run by `runInTerminal.run` again.

## Known Issues

* The `${relativeFile}` substition token only works when you have opened an entire folder with `vscode`, not a single file.
* Unknown behavior when many commands in 'runInTerminal.commands' match both the `match` expression and `name` of the command run.

## Release Notes

### 0.0.1

Initial release.
