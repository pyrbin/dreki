import { Scheduler, Stages } from "../src/scheduler/mod";
import { Stage } from "../src/scheduler/stage";
import { World } from "../src/world/mod";

test("execution order", () => {
  let value = 0;
  const init = () => {
    expect(value).toBe(0);
    value += 1;
  };

  const preUpdate = () => {
    expect(value).toBe(1);
    value += 10;
  };

  const update = () => {
    expect(value).toBe(11);
    value *= 10;
  };

  const postUpdate = () => {
    expect(value).toBe(110);
    value += 15;
  };

  const lastUpdate = () => {
    expect(value).toBe(125);
    value -= 15;
  };

  const initStage = new Stage(init);
  const preUpdateStage = new Stage(preUpdate);
  const postUpdateStage = new Stage(postUpdate);
  const lastUpdateStage = new Stage(lastUpdate);

  const scheduler = new Scheduler();
  scheduler.resolveStages(
    [],
    [
      {
        order: "after",
        params: ["postUpdateStage", "lastUpdateStage", lastUpdateStage],
      },
      {
        order: "before",
        params: [Stages.Update, "preUpdateStage", preUpdateStage],
      },
      {
        order: "after",
        params: [Stages.Update, "postUpdateStage", postUpdateStage],
      },
      { order: "before", params: ["preUpdateStage", "init", initStage] },
    ],
  );

  scheduler.schedule.addSystems(Stages.Update, [update]);
  scheduler.run(new World());
});
