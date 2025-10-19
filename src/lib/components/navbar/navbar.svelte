<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import { boardDetails } from '$lib/states/navbar-board-details.svelte';
	import ArrowBigLeftDash from '@lucide/svelte/icons/arrow-big-left-dash';
	import TrelloIcon from '@lucide/svelte/icons/trello';
	import ThemeToggle from '../theme-toggle.svelte';
	import EditBoardTitle from './edit-board-title.svelte';
	import Logo from './logo.svelte';
	import UserProfileMenu from './user-profile-menu.svelte';

	const pathname = $derived(page.url.pathname);
</script>

<header class="sticky top-0 z-50 border-b bg-neutral-50 p-4 backdrop-blur-md dark:bg-neutral-900">
	<nav class="flex items-center justify-between">
		{#if pathname.startsWith('/boards')}
			<div class="flex items-center gap-x-2">
				<a href="/dashboard" class={buttonVariants({ variant: 'outline' })}>
					<ArrowBigLeftDash /> <span class="hidden sm:inline">Back to dashboard</span>
					<span class="inline sm:hidden">Back</span>
				</a>
				<div role="separator" class="h-6 w-0.5 bg-foreground/20 sm:h-7"></div>
				<div class="flex items-center gap-x-2">
					<TrelloIcon class="size-6 text-green-600 dark:text-green-500" aria-label="logo icon" />
					<div class="flex items-center space-x-1 truncate sm:space-x-2">
						<p class="text-lg">{boardDetails.title}</p>
						<EditBoardTitle />
					</div>
				</div>
			</div>
		{:else}
			<Logo />
		{/if}
		<div class="flex items-center gap-x-2">
			<UserProfileMenu />
			<ThemeToggle />
		</div>
	</nav>
</header>
