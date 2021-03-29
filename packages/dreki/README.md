# 🐉 dreki

An **[Entity-Component System](https://github.com/SanderMertens/ecs-faq)** (ecs) library written in Typescript.

> ### **⚠ Warning** <br>
>
> The package is very much a _WIP_ and offers no guarantees regarding **stability** or **backwards compatibility**. The API's will likely change as I progress creating an actual game using the library.

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
  x: number = 0;
  y: number = 0;
}

const alive = query(not(Dead), Position);

function alive_system() {
  for (const [pos] of alive) {
    // do something to alive entities ...
  }
}

const world = World.build()
  .with({ capacity: 200 })
  .stage_after(Stages.Update, "my_custom_stage")
  .systems("my_custom_stage", alive_system)
  .done();

const entity = world.spawn(Position);
const dead_entity = world.spawn(Position, Dead);

setInterval(() => {
  world.update();
}, 1 / 60);
```

## 🎉 Getting started

TODO
