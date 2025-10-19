<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { boardDetails } from '$lib/states/navbar-board-details.svelte';
	import { COLOR_VALUES } from '$lib/zod-schemas';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { tick } from 'svelte';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { buttonVariants } from '../ui/button';
	import { cn } from '$lib/utils';
	import type { SubmitFunction } from '@sveltejs/kit';

	let title = $state(boardDetails.title ?? '');
	let color = $state(boardDetails.color ?? COLOR_VALUES[0]);
	let dialogOpen = $state(false);

	// keep local fields in sync when store changes
	$effect(() => {
		title = boardDetails.title ?? '';
		color = (boardDetails as any).color ?? COLOR_VALUES[0];
	});

	$effect(() => {
		if (dialogOpen) {
			tick().then(() => document.getElementById('title')?.focus());
		}
	});

	const handleEnhance: SubmitFunction = () => {
		return async ({ update, result }) => {
			if (result.type === 'success') {
				await update();
				dialogOpen = false;
			}
		};
	};
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })} aria-label="Edit board">
		<EllipsisIcon />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit board</Dialog.Title>
			<Dialog.Description>Change the board title and color</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="?/updateBoard" use:enhance={handleEnhance} class="space-y-4">
			<div>
				<label for="title" class="block text-sm font-medium">Title</label>
				<Input id="title" name="title" bind:value={title} class="mt-1 w-full" />
			</div>

			<div>
				<label class="block text-sm font-medium">Color</label>
				<div class="mt-2 grid grid-cols-4 gap-2">
					{#each COLOR_VALUES as c, i}
						<label for={'color-' + i} class="flex cursor-pointer items-center justify-center">
							<input
								id={'color-' + i}
								type="radio"
								name="color"
								value={c}
								class="sr-only"
								bind:group={color}
							/>
							<span
								class={cn(
									'inline-block h-8 w-8 rounded',
									c,
									color === c && 'ring-2 ring-indigo-500 ring-offset-2'
								)}
							></span>
						</label>
					{/each}
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 pt-2">
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}
					>Cancel</Dialog.Close
				>
				<button type="submit" class={buttonVariants({ variant: 'default' })}>Save</button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
