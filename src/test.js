// @flow
/* eslint-env jest */
import { createEventStream, createProjection } from './index.js';

describe('createEventStream', () => {
  test('produces an object with a subscribe method', () => {
    expect(typeof createEventStream({}).subscribe).toBe('function');
  });
});

describe('createProjection', () => {
  test('produces an object with getState and subscribe methods', () => {
    const eventStream = createEventStream({});
    const store = createProjection(eventStream, a => a);

    expect(typeof store.getState).toBe('function');
    expect(typeof store.subscribe).toBe('function');
  });
});
