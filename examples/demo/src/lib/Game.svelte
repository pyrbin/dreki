<script>
  import { Position } from "../game/components";
  import { World, query } from "dreki";
	import { onMount } from "svelte";

  onMount(() => requestAnimationFrame(update));

  const all = query(Position);
  const mover = () => {
    for(const [ pos ] of all) {
      pos.x += 0.15
    }
  }

  const world = World.build()
    .systems(mover)
    .done();

  const player = world.spawn(Position);

  const update = () => {
    world.update();
    requestAnimationFrame(update)
  }
</script>

<div id="game"></div>
