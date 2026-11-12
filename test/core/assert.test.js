
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    assertString,
    assertArray,
    assertStrictArray,
    assertFinite
} = require('#functions/v2/core/assert');

// Test 1: Valid string
test('assertString accepts strings', () => {
    assert.doesNotThrow(() => {
        assertString('Miku', 'name');
    });
});

// Test 2: Invalid string
test('assertString rejects numbers', () => {
    assert.throws(
        () => assertString(123, 'name'),
        TypeError
    );
});

// Test 3: Valid array
test('assertArray accepts arrays', () => {
    assert.doesNotThrow(() => {
        assertArray(['Miku', 39], 'items');
    });
});

// Test 4: Invalid array
test('assertArray rejects non-arrays', () => {
    assert.throws(
        () => assertArray('Miku', 'items'),
        TypeError
    );
});

// Test 4.5: Reject null array
test('assertArray rejects null array', () => {
    assert.throws(
        () => assertArray(null, 'items'),
        TypeError
    );
});

// Test 5: Valid strict array
test('assertStrictArray accepts string arrays', () => {
    assert.doesNotThrow(() => {
        assertStrictArray(['Miku', 'Teto'], 'names', 'string');
    });
});

// Test 6: Mixed types
test('assertStrictArray rejects mixed arrays', () => {
    assert.throws(
        () => assertStrictArray(['Miku', 39], 'names', 'string'),
        TypeError
    );
});

// Test 7: Invalid type validator
test('assertStrictArray rejects unknown types', () => {
    assert.throws(
        () => assertStrictArray([], 'items', 'banana'),
        TypeError
    );
});

// Test 8: Null validator (should reject null)
test('assertStrictArray rejects null', () => {
    assert.throws(
        () => assertStrictArray([null], 'items', 'object'),
        TypeError
    );
});

// Test 9: Undefined validator (should reject undefined)
test('assertStrictArray rejects undefined', () => {
    assert.throws(
        () => assertStrictArray([undefined], 'items', 'object'),
        TypeError
    );
});

// even more tests (undocumented)
test('assertArray rejects unknown type', () => {
    assert.throws(
        () => assertArray([undefined], 123),
        TypeError
    );
});
test('assertString rejects unknown type', () => {
    assert.throws(
        () => assertString("Yes", null),
        TypeError
    );
});
test('assertStrictArray rejects NaN type', () => {
    assert.throws(
        () => assertStrictArray([NaN], "Numbers", "number"),
        TypeError
    );
});
test('assertStrictArray rejects Infinity type', () => {
    assert.throws(
        () => assertStrictArray([Infinity], "Numbers", "number"),
        TypeError
    );
});
test('assertStrictArray rejects negative Infinity type', () => {
    assert.throws(
        () => assertStrictArray([-Infinity], "Numbers", "number"),
        TypeError
    );
});
test('assertFinite rejects NaN type', () => {
    assert.throws(
        () => assertFinite(NaN, "Test"),
        TypeError
    );
});
test('assertFinite rejects Infinity type', () => {
    assert.throws(
        () => assertFinite(Infinity, "Test"),
        TypeError
    );
});
test('assertFinite rejects negative Infinity type', () => {
    assert.throws(
        () => assertFinite(-Infinity, "Test"),
        TypeError
    );
});
test('assertFinite accepts floats', () => {
    assert.doesNotThrow(() => {
        assertFinite(0.1, "Test")
    });
});
test('assertFinite accepts rationals', () => {
    assert.doesNotThrow(() => {
        assertFinite(1, "Test")
    });
});
test('assertFinite rejects invalid types', () => {
    assert.throws(
        () => assertFinite("what", "Test"),
        TypeError
    );
});
test('assertFinite rejects unknown name', () => {
    assert.throws(
        () => assertFinite(1, 1),
        TypeError
    );
});

test('assertStrictArray accepts empty arrays', () => {
    assert.doesNotThrow(() => {
        assertStrictArray([], "items", "string")
    });
})
test('assertStrictArray accepts many different number types', () => {
    assert.doesNotThrow(() => {
        assertStrictArray([0, -1, 3.14], "numbers", "number")
    });
})
test('assertFinite accepts max float', () => {
    assert.doesNotThrow(() => {
        assertFinite(Number.MAX_VALUE, "value")
    });
})
test('assertFinite accepts min float', () => {
    assert.doesNotThrow(() => {
        assertFinite(Number.MIN_VALUE, "value")
    });
})