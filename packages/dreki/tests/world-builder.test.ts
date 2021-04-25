import { World } from "../src/mod";
import { get_component_id } from "../src/component/register";
import { Stages } from "../src/scheduler/mod";
import { Stage } from "../src/scheduler/stage";
import { Position, Scale, Time } from "./utils/data";

const test_system1 = () => {};
const test_system2 = () => {};

test("throws if non-existant stage", () => {
  expect(() =>
    World.build()
      .systems("pre_update", test_system2)
      .stage_after(Stages.Update, "post_update", new Stage(test_system1))
      .done(),
  ).toThrow();
});

test("pre-insert systems to a stage", () => {
  const world = World.build()
    .systems("post_update", test_system2)
    .stage_after(Stages.Update, "post_update", new Stage(test_system1))
    .done();
  const systems = world.scheduler.schedule.stages.get("post_update")!.systems;
  expect(systems[0].func).toBe(test_system1);
  expect(systems[1].func).toBe(test_system2);
});

test("register components", () => {
  const world = World.build().components(Position, Scale).done();
  const pos_id = get_component_id(Position);
  const scale_id = get_component_id(Scale);
  expect(world.storage.get(pos_id)).toBeDefined();
  expect(world.storage.get(scale_id)).toBeDefined();
});

test("add resources", () => {
  const world = World.build().resources(new Time(256)).done();
  expect(world.resource(Time).dt).toBe(256);
});
