'use strict';

/**
 * Custom jest test environment.
 *
 * Node 18-22 exposes ReadableStream / WritableStream etc. as non-configurable
 * or non-writable globals. jest-environment-node 30.x tries to assign these
 * globals in its constructor, which throws
 * "TypeError: Attempted to assign to readonly property" in strict mode,
 * causing the entire test suite to fail before any test runs.
 *
 * Fix: patch the globals at module-load time (before NodeEnvironment is
 * instantiated) so they are configurable/writable when the constructor runs.
 */

const streamGlobals = [
  'ReadableStream',
  'ReadableStreamDefaultController',
  'ReadableStreamDefaultReader',
  'ReadableStreamBYOBReader',
  'ReadableStreamBYOBController',
  'WritableStream',
  'WritableStreamDefaultController',
  'WritableStreamDefaultWriter',
  'TransformStream',
  'TransformStreamDefaultController',
  'ByteLengthQueuingStrategy',
  'CountQueuingStrategy',
];

for (const name of streamGlobals) {
  try {
    const desc = Object.getOwnPropertyDescriptor(globalThis, name);
    if (!desc) continue;

    if (desc.get && !desc.set) {
      // Getter-only: read the value, then redefine as a writable value prop
      const value = globalThis[name];
      Object.defineProperty(globalThis, name, {
        value,
        writable: true,
        enumerable: desc.enumerable,
        configurable: true,
      });
    } else if (!desc.writable || !desc.configurable) {
      Object.defineProperty(globalThis, name, {
        ...desc,
        configurable: true,
        writable: true,
      });
    }
  } catch (_) {
    // Already writable/configurable or cannot be patched — ignore
  }
}

const { TestEnvironment } = require('jest-environment-node');
module.exports = TestEnvironment;
