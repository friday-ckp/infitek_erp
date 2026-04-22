'use strict';

/**
 * Custom jest test environment to work around Node 18–22 + jest 30 compatibility.
 *
 * Problem: jest-environment-node 30.x's GlobalProxy and protectProperties
 * system walks every global (ReadableStream, WritableStream, etc.) and tries
 * to define Symbol properties on them and iterate their prototype chains.
 * On Node 18–22, some of these globals are frozen/sealed or have non-writable
 * descriptors, causing "TypeError: Attempted to assign to readonly property."
 *
 * Fix:
 * 1. Make stream-related globals on globalThis configurable/writable so
 *    jest-environment-node can copy them into its VM context.
 * 2. Also patch the prototype of globalThis: jest 30 creates a new object via
 *    Object.create(Object.getPrototypeOf(globalThis)) — if the prototype has
 *    non-writable props, assignments through the Proxy would fail.
 * 3. Use globalsCleanup: 'off' in testEnvironmentOptions (set in package.json)
 *    to skip protectProperties entirely.
 */

// --- Patch globalThis own properties ---
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
    // Cannot patch — ignore
  }
}

// --- Also patch globalThis's prototype (used by jest 30 GlobalProxy) ---
try {
  const proto = Object.getPrototypeOf(globalThis);
  if (proto && proto !== Object.prototype) {
    for (const name of streamGlobals) {
      try {
        const desc = Object.getOwnPropertyDescriptor(proto, name);
        if (!desc) continue;
        if (desc.get && !desc.set) {
          const value = proto[name];
          Object.defineProperty(proto, name, {
            value,
            writable: true,
            enumerable: desc.enumerable,
            configurable: true,
          });
        } else if (!desc.writable || !desc.configurable) {
          Object.defineProperty(proto, name, {
            ...desc,
            configurable: true,
            writable: true,
          });
        }
      } catch (_) {
        // Cannot patch — ignore
      }
    }
  }
} catch (_) {
  // Cannot access prototype — ignore
}

// --- Export the environment class (compatible with jest 29 and 30) ---
const envModule = require('jest-environment-node');
module.exports = envModule.TestEnvironment || envModule;
