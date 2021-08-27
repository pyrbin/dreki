import { WorldBuilder, Plugin, Stages, Stage, labels } from "dreki";
import { Keyboard, keyboardInputSystem } from "./keyboard";
import { Mouse, MouseMotion, MouseWheel, mouseInputSystem } from "./mouse";

// stages
export const InputStages = labels("input", {
  Emit: "emit",
});

// plugin
export class InputPlugin implements Plugin {
  register(builder: WorldBuilder) {
    const keyboard = new Keyboard();
    const mouse = new Mouse();

    builder
      .events(MouseMotion, MouseWheel)
      .resources(keyboard, mouse)
      .stageAfter(Stages.Last, InputStages.Emit, new Stage(mouseInputSystem, keyboardInputSystem));
  }
}

// exports
export { MouseMotion, MouseWheel, Keyboard, Mouse };
export { Key } from "./keyboard";
export { MouseButton } from "./mouse";
