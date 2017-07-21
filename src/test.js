// @flow
/* eslint-env jest */
import { identity } from 'ramda';

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
    const store = createProjection(eventStream, identity);

    expect(typeof store.getState).toBe('function');
    expect(typeof store.subscribe).toBe('function');
  });

  test('projection reflects all events that have happened accurately', () => {
    const eventStream = createEventStream({
      decrement: () => ({ type: 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' }),
    });

    const reducer = (state = { value: 0 }, event) => {
      switch (event.type) {
        case 'DECREMENT':
          return { value: state.value - 1 };
        case 'INCREMENT':
          return { value: state.value + 1 };
        default:
          return state;
      }
    };

    const store = createProjection(eventStream, reducer);
    expect(store.getState()).toEqual({ value: 0 });

    eventStream.increment();
    expect(store.getState()).toEqual({ value: 1 });

    eventStream.increment();
    expect(store.getState()).toEqual({ value: 2 });

    eventStream.increment();
    eventStream.increment();
    expect(store.getState()).toEqual({ value: 4 });

    eventStream.decrement();
    eventStream.decrement();
    expect(store.getState()).toEqual({ value: 2 });
  });

  test('projection calls update exactly once per command', () => {
    const eventStream = createEventStream({
      increment: () => ({ type: 'INCREMENT' }),
    });

    const store = createProjection(eventStream, identity);

    const subscriber = jest.fn(identity);
    store.subscribe(subscriber);

    eventStream.increment();
    expect(subscriber).toHaveBeenCalledTimes(1);

    eventStream.increment();
    eventStream.increment();
    expect(subscriber).toHaveBeenCalledTimes(3);
  });
});
