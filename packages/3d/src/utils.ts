import { Runtime } from "dreki";
import { Object3D, Mesh, Scene, Camera, Vector3 } from "three";
import { CurrentScene } from "./core/components";
import { number3 } from "./types";
import { MainCamera } from "./renderer/components";
import { nanoid } from "nanoid";
import { Transform } from "./core/transform";

export const utils = {
  transform: {
    dispose(transform: Transform) {
      if (transform instanceof Mesh) {
        transform.geometry?.dispose();
        if (Array.isArray(transform.material)) {
          transform.material.forEach((x) => x?.dispose());
        } else {
          transform.material?.dispose();
        }
      }
    },
  },
};

/*
export namespace utils {
  export namespace crypto {
    export function id() {
      return nanoid();
    }
  }

  export namespace scene {
    export function current() {
      const world = Runtime.currentWorld;
      return world.get(world.single(CurrentScene)!, Scene);
    }
  }

  export namespace cam {
    export function main<T extends Camera = Camera>() {
      const world = Runtime.currentWorld;
      return world.get(world.single(MainCamera)!, Camera) as T;
    }
  }

  export namespace object3d {
    export function from_xyz(object: number3) {
      return new Vector3(object.x, object.y, object.z);
    }

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

  export namespace vector3 {
    export function set_from_xyz(vector: Vector3, object: number3) {
      vector.set(object.x, object.y, object.z);
    }
  }
}
*/
