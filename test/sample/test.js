const assert = require("node:assert/strict");
const { log } = require("#functions/core/log.mjs");

/**
 * Sample test for Prism's testing infrastructure.
 */
const execute = async function () {

    const start = performance.now();

    // Test basic arithmetic
    assert.equal(2 + 2, 4);
    assert.equal(10 - 5, 5);
    assert.equal(5 * 5, 25);

    // Test boolean values
    assert.ok(true);
    assert.equal(false, false);

    // Test objects
    const user = {
        name: "Miku",
        balance: 1000
    };

    assert.deepEqual(user, {
        name: "Miku",
        balance: 1000
    });

    // Test arrays
    const numbers = [1, 2, 3];

    assert.equal(numbers.length, 3);
    assert.deepEqual(numbers.map(n => n * 2), [2, 4, 6]);

    // Test synchronous errors
    assert.throws(() => {
        throw new Error("Sample error");
    }, {
        message: "Sample error"
    });

    // Test asynchronous functions
    const asyncTest = async function () {
        return 393939;
    };

    assert.equal(await asyncTest(), 393939);

    // Test asynchronous errors
    await assert.rejects(async () => {
        throw new Error("Sample async error");
    }, {
        message: "Sample async error"
    });

    const elapsed = performance.now() - start;

    assert.throws(() => {
        assert.throws(() => {
            assert.equal(1, 1);
        });
    }, {
        code: "ERR_ASSERTION",
        message: "Missing expected exception."
    });

    log.success(`Sample tests passed in ${elapsed.toFixed(3)}ms!`);
}

module.exports = {
    execute
}