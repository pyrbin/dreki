import type { World } from "./mod";
import { Component, ComponentBundle, ReadonlyComponents } from "../component/mod";
import { Entity } from "../entity/mod";

/**
 * Commands, a builder-like object for component/entity operations
 * on a specific entity in a world
 *
 * todo: a more advanced builder class
 */
export class Commands {
  /**
   * Create a commands-builder for given entity & world.
   * @param entity
   * @param world
   */
  constructor(readonly entity: Entity, readonly world: World) {}

  /**
   * Add components
   * @param components
   * @returns
   */
  add(...components: ComponentBundle) {
    this.world.add(this.entity, ...components);
    return this;
  }

  /**
   * Remove components
   * @param component
   * @returns
   */
  remove(...component: ReadonlyComponents) {
    this.world.remove(this.entity, ...component);
    return this;
  }

  /**
   * Enable component
   * @param component
   * @returns
   */
  enable(component: Component) {
    this.world.enable(this.entity, component);
    return this;
  }

  /**
   * Disable component
   * @param component
   * @returns
   */
  disable(component: Component) {
    this.world.disable(this.entity, component);
    return this;
  }

  /**
   * Get component & end the command sequence
   * @param component
   * @returns
   */
  get<T extends Component>(component: T) {
    return this.world.get(this.entity, component);
  }

  /**
   * Despawn entity
   */
  despawn(): void {
    this.world.despawn(this.entity);
  }
}
