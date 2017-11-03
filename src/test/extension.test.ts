//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

/* global suite, test */
// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as runInTerminal from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {

    test("isMatch", () => {
        assert.equal(true, runInTerminal.isMatch('.*', 'foo'));
        assert.equal(true, runInTerminal.isMatch('.*\\.rb$', 'foo.rb'));
        assert.equal(false, runInTerminal.isMatch('.*\\.rb$', 'foo.py'));
    });
});