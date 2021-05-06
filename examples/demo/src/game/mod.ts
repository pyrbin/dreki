import * as THREE from "three";
import { OrbitControls } from "@three-ts/orbit-controls";

import { World, query, Entity } from "dreki";
import { Dreki3D, MainCamera, WebGLRendererContext } from "dreki-3d";

import { Player, Speed, Time } from "./data";

const all = query(THREE.Mesh, Speed, Entity);
const mover = (world: World) => {
  const { dt } = world.resource(Time);
  for (const [mesh, { value }, entity] of all) {
    mesh.rotation.z += value * dt;
    mesh.rotation.y += (value / 2) * dt;
  }
};

let world: World;

export function init(container: string) {
  const time = new Time();

  const dreki3d = new Dreki3D({ container });

  // prettier-ignore
  world = World.build()
    .systems(mover)
    .resources(time)
    .plugins(dreki3d)
    .done();

  return {
    world,
    time,
  };
}

export function spawn_player() {
  if (world.try_single(Player) !== undefined) return;
  const geometry = new THREE.BoxBufferGeometry(2, 2, 2);
  const material = new THREE.MeshPhongMaterial({ color: "#ff2" });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 3, 0);
  world.spawn(new Speed(0.0015), mesh, Player);
}

export function kill_player() {
  const player = world.try_single(Player);
  if (player == undefined) return;
  world.despawn(player);
}

export async function load() {
  await world.load();

  populate(world);

  const cam = world.get(world.single(MainCamera)!, THREE.Camera);
  const renderer = world.resource(WebGLRendererContext).renderer;
  const controls = new OrbitControls(cam, renderer.domElement);
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI;
  controls.minDistance = 0;
  controls.maxDistance = Infinity;
  controls.enableZoom = true; // Set to false to disable zooming
  controls.zoomSpeed = 1.0;
  controls.enablePan = true; // Set to false to disable panning (ie vertical and horizontal translations)
  controls.enableDamping = true; // Set to false to disable damping (ie inertia)
  controls.dampingFactor = 0.25;
}

function populate(world: World) {
  spawn_player();

  {
    const planeSize = 40;
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      "https://threejsfundamentals.org/threejs/resources/images/checker.png",
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    world.spawn(mesh);
  }
  {
    const sphereRadius = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(
      sphereRadius,
      sphereWidthDivisions,
      sphereHeightDivisions,
    );
    const sphereMat = new THREE.MeshPhongMaterial({ color: "#CA8" });
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.set(-sphereRadius - 3, sphereRadius + 2, 0);
    world.spawn(mesh);
  }
}
