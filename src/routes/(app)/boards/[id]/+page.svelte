<script lang="ts">
	import { boardDetails } from '$lib/states/navbar-board-details.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	$effect(() => {
		if (data.board.title) boardDetails.title = data.board.title;
	});
</script>

<h1>Board : {data.board.title}</h1>
