import * as THREE from "three";
import { Entity, events, query, res, World } from "dreki";
import { added, removed } from "dreki/filters";
import { utils } from "../utils";
import { CurrentScene } from "./components";

export const UserDataKey = "dreki3d";

/**
 * Type of {@link THREE.Object3D.userData} with included data for dreki-3d.
 */
export type UserDataObject3D = THREE.Object3D["userData"] & {
  [UserDataKey]: {
    entity: Entity;
    disableAutoSpawn: boolean;
  };
};

/**
 * Utiltiy to disable auto spawn of an Object3D.
 * @param object
 * @returns
 */
export function disableAutoSpawn(object: THREE.Object3D) {
  object.userData[UserDataKey] = object.userData[UserDataKey] ?? {};
  (object.userData as UserDataObject3D)[UserDataKey].disableAutoSpawn = true;
  return object;
}

/**
 * An alias to {@link THREE.Object3D}.
 */
export const Transform = THREE.Object3D;
export type Transform = InstanceType<typeof Transform>;

/**
 * A parent reference
 */
export class Parent {
  readonly entity: Entity;
  constructor(entity: Entity) {
    this.entity = entity;
  }
}

/**
 * A collection of children for a {@link Transform}
 */
export class Children {
  #entities: Set<Entity>;

  constructor(...values: readonly Entity[]) {
    this.#entities = new Set(values);
  }

  /**
   * Returns true if entity exists in children set.
   * @param entity
   * @returns
   */
  has(entity: Entity) {
    return this.#entities.has(entity);
  }

  /**
   * Iterate each children.
   * @returns
   */
  iter(): IterableIterator<Entity> {
    return this.#entities[Symbol.iterator]();
  }

  get length() {
    return this.#entities.size;
  }
}

/**
 * Spawn an entity with transform event
 */
export class SpawnTransform {
  readonly transform: Transform;
  readonly parent: Entity = Entity.none;
  constructor(transform: Transform, parent: Entity) {
    this.transform = transform;
    this.parent = parent;
  }
}

/**
 * Transform reference to entity mapping
 */
export class TransformToEntity extends Map<Transform, Entity> {}

/**
 * Handles transform parent-child hierarchy
 * @param world
 */
export function transformUpdateSystem(world: World) {
  const transformToEntity = res(TransformToEntity);
  const spawnTransformEvents = events(SpawnTransform);

  for (const [transform, entity] of query(added(Transform), Entity)) {
    transformToEntity.set(transform, entity);
    (transform.userData as UserDataObject3D)[UserDataKey].entity = entity;
    const children: Entity[] = [];

    // add all children
    for (const child of transform.children) {
      const userData = child.userData as UserDataObject3D;
      const childEntity =
        transformToEntity.get(child) ?? userData.dreki3d.disableAutoSpawn
          ? undefined
          : world.spawn(child);
      if (childEntity == undefined) continue;
      world.add(childEntity, new Parent(childEntity));
      children.push(childEntity);
    }

    // add children to entity
    addChildren(entity, children, world);

    if (transform.parent == undefined) {
      const scene = world.get(world.trySingle(CurrentScene)!, THREE.Scene);
      scene.add(transform);
    }

    if (transform.parent) {
      const parentEntity = transformToEntity.get(transform.parent!)!;
      world.add(entity, new Parent(parentEntity));
      if (!world.get(parentEntity, Children)?.has(entity))
        addChildren(parentEntity, [entity], world);
    }

    // when added to new parent
    transform.addEventListener("added", () => {
      childParentModification(world, entity, transform, false);
    });

    // when removed from parent
    transform.addEventListener("removed", () => {
      childParentModification(world, entity, transform, true);
    });

    // override Object3D.add to emit SpawnTransform on added children if it doesn't exist as an entity
    transform.add = (...objects) => {
      for (const child of objects) {
        const userData = child.userData as UserDataObject3D;
        if (!transformToEntity.has(child) && !userData[UserDataKey].disableAutoSpawn) {
          spawnTransformEvents.emit({ transform: child, parent: entity });
        }
      }
      return transform.add(...objects);
    };
  }

  for (const { transform } of spawnTransformEvents.iter()) {
    // if transform already haven't been spawned, create it.
    if (!transformToEntity.has(transform)) {
      world.spawn(transform);
    }
  }

  for (const [transform, entity] of query(removed(Transform), Entity)) {
    transform.parent?.remove(transform);
    transformToEntity.delete(transform);
    utils.transform.dispose(transform);
    if (world.exists(entity)) {
      world.remove(entity, Children);
    }
  }

  for (const [children, entity] of query(removed(Children), Entity)) {
    for (const child of children.iter()) {
      if (world.exists(entity)) {
        // if parent entity exists
        const scene = world.single(CurrentScene);
        // if we have a current scene (which we should always have), make that parent
        if (scene) world.add(child, new Parent(scene));
        // else just remove parent
        else world.remove(child, Parent);
      } else {
        // if parent entity doesn't exists, remove children
        world.despawn(child);
      }
    }
  }
}

function childParentModification(
  world: World,
  entity: Entity,
  transform: Transform,
  remove = false,
) {
  const transformToEntity = res(TransformToEntity);

  if (transform.parent == undefined || !transformToEntity.has(transform.parent)) {
    return;
  }

  const parentEntity = transformToEntity.get(transform.parent)!;

  if (remove) world.remove(entity, Parent);
  else world.add(entity, new Parent(parentEntity));

  if (remove) removeChildren(parentEntity, [entity], world);
  else addChildren(parentEntity, [entity], world);
}

/**
 * Add child to children
 * @param parent
 * @param children
 * @param world
 */
function addChildren(parent: Entity, children: Entity[], world: World) {
  const oldChildren = [...(world.get(parent, Children).iter() ?? [])];
  world.add(parent, new Children(...[...oldChildren, ...children]));
}

/**
 * Remove child from parent
 * @param parent
 * @param children
 * @param world
 */
function removeChildren(parent: Entity, children: Entity[], world: World) {
  const oldChildren = new Set([...(world.get(parent, Children).iter() ?? [])]);
  for (const child of children) oldChildren.delete(child);
  world.add(parent, new Children(...oldChildren));
}
