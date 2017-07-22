// @flow
/* eslint-env jest */
import { identity, reduce } from 'ramda';

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

describe('generator playground', () => {
  function* range(max) {
    for (let i = 0; i < max; i += 1) {
      yield i;
    }
  }

  test('simple generator works', () => {
    const myRange = range(4);
    expect(myRange.next()).toEqual({ done: false, value: 0 });
    expect(myRange.next()).toEqual({ done: false, value: 1 });
    expect(myRange.next()).toEqual({ done: false, value: 2 });
    expect(myRange.next()).toEqual({ done: false, value: 3 });
    expect(myRange.next()).toEqual({ done: true, value: undefined });
  });

  test('ramda reduce works on generators', () => {
    const myRange = range(4);
    const mapGeneratorToArray = reduce((acc, next) => {
      return acc.concat([next]);
    }, []);

    const myRangeDoubled = mapGeneratorToArray(myRange);
    expect(myRangeDoubled).toEqual([0, 1, 2, 3]);
  });

  test('consGenerator', () => {
    function consGenerator(value: *, generator?: Generator<*, *, *>) {
      if (generator === undefined) {
        return (function*() {
          yield value;
        })();
      }
      const x = generator;
      return (function*() {
        yield value;
        yield* x;
      })();
    }

    const one = consGenerator(1);
    expect(one.next()).toEqual({ done: false, value: 1 });
    expect(one.next()).toEqual({ done: true, value: undefined });

    const oneTwo = consGenerator(1, consGenerator(2));
    expect(oneTwo.next()).toEqual({ done: false, value: 1 });
    expect(oneTwo.next()).toEqual({ done: false, value: 2 });
    expect(oneTwo.next()).toEqual({ done: true, value: undefined });

    expect([...consGenerator(1, consGenerator(2))]).toEqual([1, 2]);

    expect([...consGenerator(-1, range(4))]).toEqual([-1, 0, 1, 2, 3]);
  });

  test('concatGenerator', () => {
    function concatGenerator(
      generator1: Generator<*, *, *>,
      generator2: Generator<*, *, *>,
    ) {
      return (function*() {
        yield* generator1;
        yield* generator2;
      })();
    }

    expect([...concatGenerator(range(2), range(2))]).toEqual([0, 1, 0, 1]);
  });

  test('ramda reduce can produce a generator', () => {
    function consGenerator(value: *, generator?: Generator<*, *, *>) {
      if (generator === undefined) {
        return (function*() {
          yield value;
          return;
        })();
      }
      const x = generator;
      return (function*() {
        yield value;
        yield* x;
      })();
    }

    function concatGenerator(
      generator1: Generator<*, *, *>,
      generator2: Generator<*, *, *>,
    ) {
      return (function*() {
        yield* generator1;
        yield* generator2;
      })();
    }

    const mapGenerator = (mapFunction, generator) => {
      return reduce(
        (acc, next) => concatGenerator(acc, consGenerator(mapFunction(next))),
        (function*() {
          return;
        })(),
        generator,
      );
    };

    const myRange = range(4);
    expect([...myRange]).toEqual([0, 1, 2, 3]);

    const myRangeDoubled = mapGenerator(a => a * 2, range(4));
    expect(myRangeDoubled).not.toEqual([0, 2, 4, 6]);
    expect([...myRangeDoubled]).toEqual([0, 2, 4, 6]);
  });
});
