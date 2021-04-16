import { get_or_insert, get_instance_and_type } from "@dreki.land/shared";
import { World, WorldOptions } from "./mod";
import type { Components } from "../component/mod";
import { DEFAULT_ENTITY_CAPACITY } from "../constants";
import { StageCreationParams, Stages } from "../scheduler/mod";
import { Stage, StageLabel } from "../scheduler/stage";
import { System, SystemFunc } from "../scheduler/system";
import type { Resource, ResourceInstance } from "./resources";

/**
 * World builder
 */
export class WorldBuilder {
  private stages: StageCreationParams[];
  private world_systems: Map<string, SystemFunc[]>;
  private world_resources: ResourceInstance[];
  private world_components: Components;
  private options: WorldOptions;

  constructor() {
    this.stages = [];
    this.world_systems = new Map();
    this.world_resources = [];
    this.world_components = [];
    this.options = {
      capacity: DEFAULT_ENTITY_CAPACITY,
    };
  }

  /**
   * Add partial world options to the final world.
   * @param options
   */
  with(options: Partial<WorldOptions>) {
    Object.assign(this.options, options);
    return this;
  }

  /**
   * Insert resources to the builder. If a constructor is provided a new instance
   * of the resource will be created using `new`.
   * @param resources
   */
  resources(...resources: (Resource | ResourceInstance)[]) {
    for (let i = 0; i < resources.length; i++) {
      const [instance] = get_instance_and_type(resources[i]);
      this.world_resources.push(instance);
    }
    return this;
  }

  /**
   * Registers components to the world. This is normally not needed as components
   * are automatically registered when it's added to an entity.
   *
   * However if you want to make sure components ID's are always consistent
   * between runs you can register them here and their ID's will be assigned in the order
   * they are registered.
   * @param components
   */
  components(...components: Components) {
    this.world_components.push(...components);
    return this;
  }

  /**
   * Add systems to the given stage. If no stage is supplied eg. the params
   * array only contains systems, then the default Stages.Update will be used.
   *
   * Systems will be added after the stage has been created, thus always come after a stages'
   * initial systems regardless of when it was added to the builder.
   *
   * ```ts
   * // Add systems to Stages.Update
   * builder.systems(example_system, other_system);
   *
   * // Add to stage "example-stage"
   * builder.systems("example-stage", example_system, other_system)
   * ```
   * @param params Systems to insert. The first element in the array can be used to specify stage.
   */
  systems(...params: [StageLabel, ...SystemFunc[]] | SystemFunc[]) {
    const with_given_stage = typeof params[0] === "string";

    const stage = (with_given_stage ? params[0] : Stages.Update) as StageLabel;
    const systems = (with_given_stage ? params.slice(1) : params) as SystemFunc[];

    get_or_insert(this.world_systems, stage, () => []).push(...systems);
    return this;
  }

  /**
   * Add a stage with a label that updates after `target` given stage.
   * @param target
   * @param label
   * @param stage
   */
  stage_after(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.stages.push({ order: "after", params: [target, label, stage] });
    return this;
  }

  /**
   * Add a stage with a label that updates before given `target` stage.
   * @param target
   * @param label
   * @param stage
   */
  stage_before(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.stages.push({ order: "before", params: [target, label, stage] });
    return this;
  }

  /**
   * Finishes the build & retrieves the final world.
   * @returns
   */
  done(): World {
    const world = new World(this.options);

    // Resolve the order of the stages
    world.scheduler.resolve_stages(this.stages);

    // Add systems that have been added outside stage creation
    for (const [label, systems] of this.world_systems.entries()) {
      world.scheduler.schedule.insert_systems(label, systems);
    }

    // Registers components
    for (const component of this.world_components) {
      world.register(component);
    }

    // Adds resources
    for (const component of this.world_resources) {
      world.add_resource(component);
    }

    return world;
  }
}
