<script lang="ts">
  import Stats from "stats.js";
  import { init, load, kill_player, spawn_player} from "../game/mod";
	import { onMount } from "svelte";

  let previous = 0;

  const stats = new Stats();
  const { world, time } = init("#game");

  onMount(async () => {
    document.body.appendChild( stats.dom );

    await load();

    const update = (current: number) => {
      stats.begin();
      const dt = current - previous;
      previous = current;
      time.dt = dt;
      world.update();
      stats.end();
      requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  });


</script>

<div id="game"/>

<div class="actions">
  <div class="bg-gray-500 icon kill hover:bg-red-200" on:click={kill_player}>☠</div>
  <div class="bg-gray-500 icon spawn hover:bg-red-200" on:click={spawn_player}>❤</div>
</div>

<style scoped>
  #game{
    max-width: 100%;
    @apply w-full h-full flex;
  }
  .actions {
    min-width:200px;
    left: 50%;
    transform: translate(-50%, 0);
    @apply text-yellow-300 bg-black absolute border-yellow-300 pl-2
            border-2 h-16 bottom-0 z-10 rounded-lg my-4 shadow-lg;
    @apply flex flex-row items-center;
  }
  .icon {
    @apply p-2 mr-2 rounded cursor-pointer duration-150 transition-all;
  }
</style>
