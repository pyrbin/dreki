<script>
  import Game from "./lib/game.svelte";
  import Tailwind from "./lib/tailwind.svelte";
</script>

<Tailwind />

<main>
    <h1> 🐲 dreki / <span class="">demo3d</span></h1>
    <Game />
</main>

<style scoped>
  :global(body) {
    margin: 0!important;
  }
  main {
    @apply flex flex-col overflow-hidden w-screen h-screen;
  }
  h1 {
    @apply text-yellow-300 bg-black absolute border-yellow-300 border-2
          font-mono p-1 px-2 rounded-lg m-2 text-lg;
  }
  h1 span {
    @apply text-white text-2xl;
  }
</style>
