<script lang='ts'>
  import Navbar from '$lib/components/navbar/navbar.svelte'

  const { children } = $props()
</script>

<Navbar />
<main class='container mx-auto grow p-4'>
  {@render children?.()}
</main>
