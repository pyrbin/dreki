<script lang="ts">
  import { onMount } from "svelte";
  import { init } from "./game";

  onMount(() => {
    const game = init(10_000);
    function update() {
      game.update();
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  })
</script>
