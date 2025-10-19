<script lang="ts">
	import { enhance } from '$app/forms';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageProps } from './$types';
	import BoardStats from './_components/board-stats.svelte';
	import BoardFilters from './_components/board-filters.svelte';
	import BoardList from './_components/board-list.svelte';
	import type { ViewMode } from '$lib/utils';

	let { data }: PageProps = $props();

	let viewMode = $state<ViewMode>('grid');

	function onViewModeChange(newMode: ViewMode) {
		viewMode = newMode;
	}

	let formId = 'create-board-id';
</script>

<div class="mb-6 sm:mb-8">
	<h1>Welcome Back, {data.user.name}</h1>
	<p class="text-primary-foreground/80">
		Here&apos;s what&apos;s happening with your boards today.
	</p>
	<form method="post" id={formId} use:enhance>
		<Button type="submit" class="w-full sm:w-auto">
			<PlusIcon class="size-4" /> Create Board
		</Button>
	</form>
	<BoardStats boards={data.boards} />
	<BoardFilters {formId} {viewMode} {onViewModeChange} />
	<BoardList boards={data.boards} {viewMode} />
</div>
