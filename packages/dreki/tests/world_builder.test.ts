import { World } from "../src/mod";
import { getComponentId } from "../src/component/register";
import { Stages } from "../src/scheduler/mod";
import { Stage } from "../src/scheduler/stage";
import { Position, Scale, Time } from "./utils/data";

const testSystem1 = () => {
  // empty
};

const testSystem2 = () => {
  // empty
};

test("throws if non-existant stage", () => {
  expect(() =>
    World.build()
      .systems("preUpdate", testSystem2)
      .stageAfter(Stages.Update, "postUpdate", new Stage(testSystem1))
      .done(),
  ).toThrow();
});

test("pre-insert systems to a stage", () => {
  const world = World.build()
    .systems("postUpdate", testSystem2)
    .stageAfter(Stages.Update, "postUpdate", new Stage(testSystem1))
    .done();
  const systems = world.scheduler.schedule.stages.get("postUpdate")!.systems;
  expect(systems[0].func).toBe(testSystem1);
  expect(systems[1].func).toBe(testSystem2);
});

test("register components", () => {
  const world = World.build().components(Position, Scale).done();
  const posId = getComponentId(Position);
  const scaleId = getComponentId(Scale);
  expect(world.storage.get(posId)).toBeDefined();
  expect(world.storage.get(scaleId)).toBeDefined();
});

test("add resources", () => {
  const world = World.build().resources(new Time(256)).done();
  expect(world.resource(Time).dt).toBe(256);
});
