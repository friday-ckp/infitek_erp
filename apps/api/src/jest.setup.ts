/**
 * Jest setup: make Web Streams API globals configurable.
 *
 * Node 18-22 exposes ReadableStream / WritableStream etc. as non-configurable
 * globals. Jest 30's environment setup tries to redefine these, which throws
 * "TypeError: Attempted to assign to readonly property" and prevents the test
 * suite from even loading. Making them configurable first silences the error.
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
] as const;

streamGlobals.forEach((name) => {
  const desc = Object.getOwnPropertyDescriptor(globalThis, name);
  if (desc && !desc.configurable) {
    Object.defineProperty(globalThis, name, {
      ...desc,
      configurable: true,
      writable: true,
    });
  }
});
