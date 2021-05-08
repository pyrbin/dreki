import { Scheduler, Stages } from "../src/scheduler/mod";
import { Stage } from "../src/scheduler/stage";
import { World } from "../src/world/mod";

test("execution order", () => {
  let value = 0;
  const init = (world: World) => {
    expect(value).toBe(0);
    value += 1;
  };

  const pre_update = (world: World) => {
    expect(value).toBe(1);
    value += 10;
  };

  const update = (world: World) => {
    expect(value).toBe(11);
    value *= 10;
  };

  const post_update = (world: World) => {
    expect(value).toBe(110);
    value += 15;
  };

  const last_update = (world: World) => {
    expect(value).toBe(125);
    value -= 15;
  };

  const init_stage = new Stage(init);
  const pre_update_stage = new Stage(pre_update);
  const post_update_stage = new Stage(post_update);
  const last_update_stage = new Stage(last_update);

  const scheduler = new Scheduler();
  scheduler.resolve_stages(
    [],
    [
      {
        order: "after",
        params: ["post_update_stage", "last_update_stage", last_update_stage],
      },
      {
        order: "before",
        params: [Stages.Update, "pre_update_stage", pre_update_stage],
      },
      {
        order: "after",
        params: [Stages.Update, "post_update_stage", post_update_stage],
      },
      { order: "before", params: ["pre_update_stage", "init", init_stage] },
    ],
  );

  scheduler.schedule.insert_systems(Stages.Update, [update]);
  scheduler.run(new World());
});
