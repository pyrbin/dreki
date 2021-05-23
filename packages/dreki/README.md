# 🐉 dreki

An **[Entity-Component System](https://github.com/SanderMertens/ecs-faq)** (ecs) library written in Typescript.

> 🚧 The package is a work-in-progress and might be **unstable**, use it at your own risks. 🚧

[📝 Changelogs](CHANGELOG.md)

## 🚀 Install

```ts
npm i dreki
```

## 📜 Example

```ts
import { World, query } from "dreki";
import { not } from "dreki/filters";

class Dead {}

class Position {
  x: = 0;
  y: = 0;
}

const alive = query(not(Dead), Position);

function aliveSystem() {
  for (const [pos] of alive) {
    // do something to alive entities ...
  }
}

const world = World.build()
  .with({ capacity: 200 })
  .stageAfter(Stages.Update, "my_custom_stage")
  .systems("my_custom_stage", aliveSystem)
  .done();

const entity = world.spawn(Position);
const dead_entity = world.spawn(Position, Dead);

setInterval(() => {
  world.update();
}, 1 / 60);
```

## 🥳 Getting started

TODO
