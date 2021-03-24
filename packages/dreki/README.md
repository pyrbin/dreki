# 🐉 dreki

An **[Entity-Component System](https://github.com/SanderMertens/ecs-faq)** (ecs) library written in Typescript.

> ### **⚠** <br>
>
> The package is very much a _WIP_ and offers no guarantees regarding **stability** or **backwards compatibility**. The API's will likely change as I progress creating an actual game using the library.

[📝 Changelogs](CHANGELOG.md)

## Example

```typescript
import { World, query } from "dreki";
import { not } from "dreki/filters";

const alive = query(not(Dead), Position);

function alive_system() {
  for (const [pos] of alive) {
    // do something to alive entities ...
  }
}

const world = World.build()({ capacity: 200 })
  .stage_after(Stages.Update, "my_custom_stage")
  .systems("my_custom_stage", alive_system)
  .done();

setInterval(() => {
  world.update();
}, 1 / 60);
```

## 🎉 Getting started
