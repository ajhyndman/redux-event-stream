// @flow
import test from 'tape';

import { createEventStream, createProjection } from './index.js';

test('createEventStream', assert => {
  assert.test('produces an object with a subscribe method', assert => {
    assert.equal(typeof createEventStream({}).subscribe, 'function');
    assert.end();
  });

  assert.end();
});

test('createProjection', assert => {
  assert.test(
    'produces an object with getState and subscribe methods',
    assert => {
      const eventStream = createEventStream({});
      const store = createProjection(eventStream, a => a);

      assert.equal(typeof store.getState, 'function');
      assert.equal(typeof store.subscribe, 'function');
      assert.end();
    },
  );

  assert.end();
});
