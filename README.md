# redux-event-stream

A thin wrapper around Redux that exposes an API inspired by [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html).

## Concepts

* Observable Event Stream is a top level entity
* Event Stream has a well-typed set of supported Events
* Commands dispatch to the Event Stream
* One or more Clients consumes the Event Stream

## API

```js
import { createEventStream, createProjection } from 'redux';

// Initialize the event stream separately from the store.  This becomes the one
// true source of truth for your application.
const eventStream = createEventStream({
  // Commands are the only thing that we want to couple to the eventStream.  The 
  // set of events which may end up in an eventStream should be easy to predict.
  //
  // A definition like this supports static analysis inference well for 
  // consumers that can leverage it.
  increment: () => ({ type: 'INCREMENT' }),
  decrement: () => ({ type: 'DECREMENT' }),
});

// Multiple stores with disjoint or overlapping data can be used to consume the 
// same event stream.
const store = createProjection(eventStream, reducer, init);
const adminStore = createProjection(eventStream, adminReducer, init);

// We don't need a jargon term ("Middleware"), or a dedicated hook to handle 
// async anymore.  We just register more subscribers to the eventStream.
eventStream.subscribe(myCustomMiddleWare);
eventStream.subscribe(sendEventsToAnalytics);
eventStream.subscribe(logEventsForPlayback);

// Calls to commands can be wrapped with React Providers or container components 
// in the same way that Redux currently does.  They can also be called directly.
eventStream.increment();
```
