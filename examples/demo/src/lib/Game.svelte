<script>
  import { init } from "../game/mod";
	import { onMount } from "svelte";

  onMount(() => requestAnimationFrame(update));

  const { world, time } = init();
  let previous = 0;

  const update = (current: number) => {
    const dt = current - previous;
    previous = current;

    time.dt = dt;
    world.update();
    requestAnimationFrame(update)
  }
</script>

<div id="game"></div>
