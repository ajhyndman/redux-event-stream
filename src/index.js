// @flow
import { createStore, applyMiddleware } from 'redux';
import { identity, map } from 'ramda';

export type Event = { type: string };
export type Command = () => Event;
export type EventStream = {
  subscribe: (subscriber: (event: Event) => void) => void,
  [string]: Command,
};
export type Projection<T> = {
  getState: () => T,
  // mimic redux subscribe: this just tells you if the projection has changed
  subscribe: (subscriber: () => void) => void,
};

export function createEventStream(commands: {
  [string]: Command,
}): EventStream {
  let subscribers = [];
  const eventListener = event => {
    // TODO: Consider using an "asyncIterable" pattern instead?
    subscribers.forEach(subscriber => {
      subscriber(event);
    });
  };

  const store = createStore(
    identity,
    applyMiddleware(
      (/*{ getState, dispatch }*/) => (/*next*/) => event =>
        eventListener(event),
    ),
  );

  return {
    ...map(command => (...args) => store.dispatch(command(...args)), commands),
    subscribe: subscriber => {
      subscribers.push(subscriber);
    },
  };
}

export function createProjection<T>(
  eventStream: EventStream,
  reducer: (state: T, event: Event) => T,
  init?: T,
): Projection<T> {
  const store = createStore(reducer, init);

  eventStream.subscribe(event => store.dispatch(event));

  return {
    getState: store.getState,
    subscribe: store.subscribe,
  };
}
