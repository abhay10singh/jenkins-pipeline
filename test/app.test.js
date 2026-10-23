const test = require('node:test');
const assert = require('node:assert/strict');
const { greet } = require('../app');

test('greets the supplied name', () => {
    assert.equal(greet('Abhay'), 'Hello, Abhay!');
});

test('uses Jenkins as the default name', () => {
    assert.equal(greet(), 'Hello, Jenkins!');
});

test('rejects an empty name', () => {
    assert.throws(() => greet(''), TypeError);
});
