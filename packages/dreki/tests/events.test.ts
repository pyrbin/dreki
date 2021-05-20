import { Entity } from "../src/entity/mod";
import { events, World } from "../src/mod";

class JumpEvent {
  public readonly entity: Entity;
  public readonly force: [x: number, y: number];

  constructor(entity: Entity, force: [x: number, y: number]) {
    this.entity = entity;
    this.force = force;
  }
}

const ITERATIONS = 64;

let spawned = 0;
function eventWriter() {
  const jumpEvents = events(JumpEvent);
  const value = spawned++ * 100;
  jumpEvents.emit(new JumpEvent(Entity.none, [0, value]));
}

let guard = 0;
let counter = 0;
function eventReader() {
  const jumpEvents = events(JumpEvent);
  if (++guard % 2 == 0) {
    for (const event of jumpEvents.iter()) {
      expect(event.entity).toBe(Entity.none);
      expect(event.force[1]).toBe(counter++ * (100 * 2));
      expect(event.force[0]).toBe(0);
    }
    for (const _ of jumpEvents.iter()) {
      // this should never be executed as the events have already been consumed
      expect(true).toBe(false);
    }
  }
}

test("event read/writer test", () => {
  const world = World.build().systems(eventReader, eventWriter).done();

  for (let i = 0; i < ITERATIONS; i++) {
    world.update();
  }

  expect(counter).toBe(spawned / 2);
});
