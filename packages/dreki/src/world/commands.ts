import type { World } from "./mod";
import { Component, ComponentBundle, ReadonlyComponents } from "../component/mod";
import { Entity } from "../entity/mod";

/**
 * Commands, a builder-like object for component/entity
 * operations on a specific entity in a world
 */
export class Commands {
  constructor(readonly entity: Entity, readonly world: World) {}

  add(...components: ComponentBundle) {
    this.world.add(this.entity, ...components);
    return this;
  }

  remove(...component: ReadonlyComponents) {
    this.world.remove(this.entity, ...component);
    return this;
  }

  enable(component: Component) {
    this.world.enable(this.entity, component);
    return this;
  }

  disable(component: Component) {
    this.world.disable(this.entity, component);
    return this;
  }

  get<T extends Component>(component: T) {
    return this.world.get(this.entity, component);
  }

  despawn(): void {
    this.world.despawn(this.entity);
  }
}
