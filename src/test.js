import test from "tape";

import { createEventStream, createProjection } from "./index.js";

test("createEventStream", assert => {
  assert.test("produces an object with a subscribe method", assert => {
    assert.equal(typeof createEventStream({}).subscribe, "function");
    assert.end();
  });
  assert.end();
});
