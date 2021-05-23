import { getOrInsert, getInstanceAndType } from "@dreki.land/shared";
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
  readonly #startupStages: StageCreationParams[];
  readonly #mainStages: StageCreationParams[];

  readonly #startupSystemsMap: Map<string, SystemFunc[]>;
  readonly #mainSystemsMap: Map<string, SystemFunc[]>;

  readonly #worldResources: ResourceInstance[];
  readonly #worldComponents: Components;
  readonly #worldPlugins: Plugin[];
  readonly #worldEvents: Event[];
  readonly #options: WorldOptions;

  constructor() {
    this.#startupStages = [];
    this.#mainStages = [];
    this.#startupSystemsMap = new Map();
    this.#mainSystemsMap = new Map();
    this.#worldResources = [];
    this.#worldComponents = [];
    this.#worldPlugins = [];
    this.#worldEvents = [];
    this.#options = {
      capacity: DEFAULT_ENTITY_CAPACITY,
    };
  }

  /**
   * Add partial world options to the final world.
   * @param options
   */
  with(options: Partial<WorldOptions>) {
    Object.assign(this.#options, options);
    return this;
  }

  /**
   * Register plugins to the world.
   * @param plugins
   */
  plugins(...plugins: Plugin[]) {
    this.#worldPlugins.push(...plugins);
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
      const [instance] = getInstanceAndType(resources[i]);
      this.#worldResources.push(instance);
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
    this.#worldComponents.push(...components);
    return this;
  }

  /**
   * Registers events to the world. This is not needed as events are automatically
   * registered when it's written/read to.
   * @param events
   */
  events(...events: Event[]) {
    this.#worldEvents.push(...events);
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
   * builder.systems(exampleSystem, otherSystem);
   *
   * // Add systems to stage "ExampleStage"
   * builder.systems("ExampleStage", exampleSystem, otherSystem)
   * ```
   * @param params Systems to insert. The first element in the array can be used to specify stage.
   */
  systems(...params: [StageLabel, ...SystemFunc[]] | SystemFunc[]) {
    this.#systemsInternal(params, Stages.Update, this.#mainSystemsMap);
    return this;
  }

  /**
   * Add a stage with a label that updates after `target` given stage.
   * @param target
   * @param label
   * @param stage
   */
  stageAfter(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.#stageInternal(target, label, "after", stage, this.#mainStages);
    return this;
  }

  /**
   * Add a stage with a label that updates before given `target` stage.
   * @param target
   * @param label
   * @param stage
   */
  stageBefore(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.#stageInternal(target, label, "before", stage, this.#mainStages);
    return this;
  }

  /**
   * Add systems to the given startup stage. If no stage is supplied eg. the params
   * array only contains systems, then the default StartupStage.Startup will be used.
   * @param params
   * @returns
   */
  startupSystems(...params: [StageLabel, ...SystemFunc[]] | SystemFunc[]) {
    this.#systemsInternal(params, StartupStages.Startup, this.#startupSystemsMap);
    return this;
  }

  /**
   * Add a startup stage with a label that updates before given `target` stage.
   * @param target
   * @param label
   * @param stage
   * @returns
   */
  startupStageAfter(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.#stageInternal(target, label, "after", stage, this.#startupStages);
    return this;
  }

  /**
   * Add a startup stage with a label that updates after given `target` stage.
   * @param target
   * @param label
   * @param stage
   * @returns
   */
  startupStageBefore(target: StageLabel, label: StageLabel, stage: Stage = new Stage()) {
    this.#stageInternal(target, label, "before", stage, this.#startupStages);
    return this;
  }

  #systemsInternal(
    params: [StageLabel, ...SystemFunc[]] | SystemFunc[],
    stageName: StageLabel,
    output: Map<string, SystemFunc[]>,
  ) {
    const withGivenStage = typeof params[0] === "string";

    const stage = (withGivenStage ? params[0] : stageName) as StageLabel;
    const systems = (withGivenStage ? params.slice(1) : params) as SystemFunc[];

    getOrInsert(output, stage, () => []).push(...systems);
  }

  #stageInternal(
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
    const world = new World(this.#options);

    // Resolve the order of the stages
    world.scheduler.resolveStages(this.#startupStages, this.#mainStages);

    // Add systems that have been added outside stage creation
    for (const [label, systems] of this.#mainSystemsMap.entries()) {
      world.scheduler.schedule.addSystems(label, systems);
    }

    // Add systems to startup
    for (const [label, systems] of this.#startupSystemsMap.entries()) {
      world.scheduler.startup.addSystems(label, systems);
    }

    // Registers components
    for (const component of this.#worldComponents) {
      world.register(component);
    }

    // Adds resources
    for (const component of this.#worldResources) {
      world.addResource(component);
    }

    // Adds events
    for (const event of this.#worldEvents) {
      world.events.set(event, new EventStore<typeof event>());
    }

    // Append plugins
    world.plugins.push(...this.#worldPlugins);

    return world;
  }
}
