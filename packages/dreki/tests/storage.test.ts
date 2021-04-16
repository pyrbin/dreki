import { bitflags } from "@dreki.land/shared";
import { ComponentFlags } from "../src/component/mod";
import { ComponentType, get_component_info_or_register } from "../src/component/register";
import { Entity } from "../src/entity/mod";
import { Storage } from "../src/storage/mod";
import { Position } from "./utils/data";

test("insert / remove", () => {
  const storage = new Storage(21);
  const entity = new Entity(20, 20);
  const info = get_component_info_or_register(Position);
  const set = storage.get_or_create(info, 21);
  const pos = new Position();
  pos.x = 2000;

  set.insert(entity, pos, ComponentFlags.None, 0);

  expect(set.length).toBe(1);
  expect(set.remove(entity)).toBe(true);
  expect(set.get(entity)).toBe(undefined);
  expect(set.length).toBe(0);
  expect(set.remove(entity)).toBe(false);
});

let ccounter = 0;
const get_info_helper = () => ({
  id: ++ccounter,
  mask: 1 << ccounter,
  component: Position,
  type: ComponentType.Data,
});

test("component disabled flag", () => {
  const storage = new Storage(5);
  const info = get_info_helper();
  const stg = storage.get_or_create(info, 24);
  const entt = new Entity(0, 0);
  stg.insert(entt, new Position(), ComponentFlags.None, 0);
  storage.get(info.id).set_flag(entt, (flag) => bitflags.insert(flag, ComponentFlags.Disabled));
  let [comp, flags] = storage.get(info.id).get_with_state(entt);
  expect(bitflags.contains(flags, ComponentFlags.Disabled)).toBe(true);
});

test("grow when at capacity", () => {
  const initial = 2;
  const final = 99;
  const storage = new Storage(initial);

  for (let i = 0; i < final; i++) {
    const info = get_info_helper();
    storage.get_or_create(info, 24);
  }
  expect(storage.sets.capacity >= final).toBe(true);
});
