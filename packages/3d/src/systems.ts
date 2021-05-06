import { query, World, Entity } from "dreki";
import { added, disabled, not, removed } from "dreki/filters";
import { Object3D, Mesh, Scene } from "three";
import { CurrentScene } from "./singletons";
import { utils } from "./utils";

const queries = {
  object3d: {
    added: query(added(Object3D), not(Scene), Entity),
    removed: query(removed(Object3D), Entity),
  },
  mesh: {
    all: query(Mesh),
  },
};

export function object3d_lifecycle(world: World) {
  const scene = utils.scene.current(world);

  // spawned
  for (const [object] of queries.object3d.added) {
    scene.add(object);
  }

  // cleanup
  for (const [object] of queries.object3d.removed) {
    utils.object3d.dispose(object);
    scene.remove(object);
  }
}
