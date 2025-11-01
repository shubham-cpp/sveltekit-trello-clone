<script lang='ts'>
  import Navbar from '$lib/components/navbar/navbar.svelte'

  const { children, data } = $props()
</script>

<Navbar organizationInfo={data.organizationInfo} />
<main class='container mx-auto grow p-4'>
  {@render children?.()}
</main>
