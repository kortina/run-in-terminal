## Release Notes

### 0.0.7

- Fix #34 🤞 by removing call to `Term.term` and using `Term.term.processId` instead of `Term.term.termName`. Tx @Lopol2010 for fix ideas in #41
- Dependabot update #43 and #44

### 0.0.6

- Add new configuration that allows you to choose whether or not to save command in history `runInTerminal.saveCommandInHistory`. Tx @mrcasals for #37
- Merge in dependabot updates.

### 0.0.4

- Fix bug where any project level settings defining runInTerminal.commands were blowing away global and default commands

### 0.0.3

- Undo a bunch of GitHub auto-fixes that broke the extension.

### 0.0.2

- Add webpack config. Add example `sh` and `py` script to test with. Fix typos in README. Fix configuration property title for `runInTerminal.commands`.

### 0.0.1

- Initial release.
