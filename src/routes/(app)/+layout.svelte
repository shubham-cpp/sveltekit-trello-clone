<script lang="ts">
	import Navbar from '$lib/components/navbar/navbar.svelte';

	let { children } = $props();
</script>

<Navbar />
<main class="container mx-auto grow p-4">
	{@render children?.()}
</main>
