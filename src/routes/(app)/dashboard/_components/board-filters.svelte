<script lang="ts">
	import { enhance } from '$app/forms';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import type { ViewMode } from '$lib/utils';
	import FunnelIcon from '@lucide/svelte/icons/funnel';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import ListIcon from '@lucide/svelte/icons/list';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';

	interface BoardFilterProps {
		formId: string;
		viewMode: ViewMode;
		onViewModeChange: (newMode: ViewMode) => void;
	}

	let { formId, viewMode, onViewModeChange }: BoardFilterProps = $props();
</script>

<section class="mb-6 sm:mb-8">
	<div
		class="mb-4 flex flex-col space-y-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-1"
	>
		<div>
			<h2 class="text-xl font-bold sm:text-2xl">Your Boards</h2>
			<p class="text-primary-foreground/70">Manage your projects and tasks</p>
		</div>
		<!-- Filter Options -->
		<div
			class="flex grow flex-col items-stretch justify-end space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6"
		>
			<div
				class="mr-2 flex items-center gap-x-2 rounded-lg border border-border bg-neutral-100 p-1 sm:mr-4 dark:bg-zinc-900"
			>
				<Button
					onclick={() => {
						onViewModeChange('grid');
					}}
					variant={viewMode === 'grid' ? 'default' : 'ghost'}
					size="icon"
				>
					<LayoutGridIcon class="size-4 sm:size-5" />
				</Button>
				<Button
					onclick={() => {
						onViewModeChange('list');
					}}
					variant={viewMode === 'list' ? 'default' : 'ghost'}
					size="icon"
				>
					<ListIcon class="size-4 sm:size-5" />
				</Button>
			</div>
			<Button variant="outline" class="mr-2 flex items-center gap-x-2 px-4 sm:mr-4">
				<FunnelIcon class="size-4 sm:size-5" /> <span>Filter</span>
			</Button>
			<Button type="submit" form={formId} class="flex items-center gap-x-2 px-4">
				<PlusIcon class="size-4 sm:size-5" /> <span>Create</span>
			</Button>
		</div>
		<!-- Search Bar -->
		<form method="get">
			<ButtonGroup.Root class="pl-6">
				<Input placeholder="Search boards..." />
				<Button type="submit" variant="outline" size="icon" aria-label="Search">
					<SearchIcon />
				</Button>
			</ButtonGroup.Root>
		</form>
	</div>
</section>
