import { query, World, Entity } from "dreki";
import { Object3D, Mesh, Scene, Camera } from "three";
import { CurrentScene, MainCamera } from "./singletons";

export namespace utils {
  export namespace scene {
    export function current(world: World) {
      return world.get(world.single(CurrentScene)!, Scene);
    }
  }

  export namespace cam {
    export function main<T extends Camera = Camera>(world: World) {
      return world.get(world.single(MainCamera)!, Camera) as T;
    }
  }

  export namespace object3d {
    export function dispose(obj: Object3D) {
      if (obj instanceof Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((x) => x?.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    }
  }
}
