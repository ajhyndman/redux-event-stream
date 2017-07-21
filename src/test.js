// @flow
/* eslint-env jest */
import { createEventStream, createProjection } from './index.js';

describe('createEventStream', () => {
  test('produces an object with a subscribe method', () => {
    expect(typeof createEventStream({}).subscribe).toBe('function');
  });

  test('produces an object with the command methods defined', () => {
    const eventStream = createEventStream({
      increment: () => ({ type: 'INCREMENT' }),
    });
    expect(typeof eventStream.increment).toBe('function');
    expect(typeof eventStream.subscribe).toBe('function');
  });

  test('notifies subscribers whenever a command is dispatched', () => {
    const eventStream = createEventStream({
      increment: () => ({ type: 'INCREMENT' }),
    });

    const subscriber = jest.fn();
    eventStream.subscribe(subscriber);
    eventStream.increment();

    expect(subscriber).toHaveBeenCalledTimes(1);
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
