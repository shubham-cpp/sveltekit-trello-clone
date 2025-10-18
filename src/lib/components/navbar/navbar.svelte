<script lang="ts">
	import ThemeToggle from '../theme-toggle.svelte';
	import Logo from './logo.svelte';
	import UserProfileMenu from './user-profile-menu.svelte';
</script>

<header class="sticky top-0 z-50 border-b bg-neutral-50 p-4 backdrop-blur-md dark:bg-neutral-900">
	<nav class="flex items-center justify-between">
		<Logo />
		<div class="flex items-center gap-x-2">
			<UserProfileMenu />
			<ThemeToggle />
		</div>
	</nav>
</header>
