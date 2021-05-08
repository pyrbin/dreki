import { get_or_insert, get_instance_and_type } from "@dreki.land/shared";
import { World, WorldOptions } from "./mod";
import type { Components } from "../component/mod";
import { DEFAULT_ENTITY_CAPACITY } from "../constants";
import { StageCreationParams, Stages, StartupStages } from "../scheduler/mod";
import { Stage, StageLabel } from "../scheduler/stage";
import { SystemFunc } from "../scheduler/system";
import type { Resource, ResourceInstance } from "./resources";
import type { Plugin } from "./plugin";
import { Event, EventStore } from "./events";

/**
 * World builder
 */
export class WorldBuilder {
  private readonly startup_stages: StageCreationParams[];
  private readonly update_stages: StageCreationParams[];

  private readonly startup_systems_map: Map<string, SystemFunc[]>;
  private readonly update_systems_map: Map<string, SystemFunc[]>;

  private readonly world_resources: ResourceInstance[];
  private readonly world_components: Components;
  private readonly world_plugins: Plugin[];
  private readonly world_events: Event[];
  private readonly options: WorldOptions;

  constructor() {
    this.startup_stages = [];
    this.update_stages = [];
    this.startup_systems_map = new Map();
    this.update_systems_map = new Map();
    this.world_resources = [];
    this.world_components = [];
    this.world_plugins = [];
    this.world_events = [];
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
   * Register plugins to the world.
   * @param plugins
   */
  plugins(...plugins: Plugin[]) {
    this.world_plugins.push(...plugins);
    for (const plugin of plugins) {
      plugin.register(this);
    }
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
   * Registers events to the world. This is not needed as events are automatically
   * registered when it's written/read to.
   * @param events
   */
  events(...events: Event[]) {
    this.world_events.push(...events);
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
   * // Add systems to stage "ExampleStage"
   * builder.systems("ExampleStage", example_system, other_system)
   * ```
   * @param params Systems to insert. The first element in the array can be used to specify stage.
   */
  systems(...params: [StageLabel, ...SystemFunc[]] | SystemFunc[]) {
    this.systems_internal(params, Stages.Update, this.update_systems_map);
    return this;
  }

  /**
   * Add a stage with a label that updates after `target` given stage.
   * @param target
   * @param label
   * @param stage
   */
  stage_after(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.stage_internal(target, label, "after", stage, this.update_stages);
    return this;
  }

  /**
   * Add a stage with a label that updates before given `target` stage.
   * @param target
   * @param label
   * @param stage
   */
  stage_before(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.stage_internal(target, label, "before", stage, this.update_stages);
    return this;
  }

  /**
   * Add systems to the given startup stage. If no stage is supplied eg. the params
   * array only contains systems, then the default StartupStage.Startup will be used.
   * @param params
   * @returns
   */
  startup_systems(...params: [StageLabel, ...SystemFunc[]] | SystemFunc[]) {
    this.systems_internal(params, StartupStages.Startup, this.startup_systems_map);
    return this;
  }

  /**
   * Add a startup stage with a label that updates before given `target` stage.
   * @param target
   * @param label
   * @param stage
   * @returns
   */
  startup_stage_after(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.stage_internal(target, label, "after", stage, this.startup_stages);
    return this;
  }

  /**
   * Add a startup stage with a label that updates after given `target` stage.
   * @param target
   * @param label
   * @param stage
   * @returns
   */
  startup_stage_before(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.stage_internal(target, label, "before", stage, this.startup_stages);
    return this;
  }

  private systems_internal(
    params: [StageLabel, ...SystemFunc[]] | SystemFunc[],
    default_stage: StageLabel,
    output: Map<string, SystemFunc[]>,
  ) {
    const with_given_stage = typeof params[0] === "string";

    const stage = (with_given_stage ? params[0] : default_stage) as StageLabel;
    const systems = (with_given_stage ? params.slice(1) : params) as SystemFunc[];

    get_or_insert(output, stage, () => []).push(...systems);
  }

  private stage_internal(
    target: StageLabel,
    label: StageLabel,
    order: "before" | "after",
    stage: Stage = new Stage(),
    output: StageCreationParams[],
  ) {
    output.push({ order, params: [target, label, stage] });
  }

  /**
   * Finishes the build & retrieves the final world.
   * @returns
   */
  done(): World {
    const world = new World(this.options);

    // Resolve the order of the stages
    world.scheduler.resolve_stages(this.startup_stages, this.update_stages);

    // Add systems that have been added outside stage creation
    for (const [label, systems] of this.update_systems_map.entries()) {
      world.scheduler.schedule.insert_systems(label, systems);
    }

    // Add systems to startup
    for (const [label, systems] of this.startup_systems_map.entries()) {
      world.scheduler.startup.insert_systems(label, systems);
    }

    // Registers components
    for (const component of this.world_components) {
      world.register(component);
    }

    // Adds resources
    for (const component of this.world_resources) {
      world.add_resource(component);
    }

    // Adds events
    for (const event of this.world_events) {
      world.events.set(event, new EventStore<typeof event>());
    }

    // Append plugins
    world.plugins.push(...this.world_plugins);

    return world;
  }
}
