<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import LogoutIcon from '@lucide/svelte/icons/log-out';
	import DropdownMenuItem from '../ui/dropdown-menu/dropdown-menu-item.svelte';

	async function handleLogout() {
		try {
			authClient.signOut({
				fetchOptions: {
					async onSuccess() {
						await goto('/login');
					}
				}
			});
		} catch (error) {
			console.error('ERROR: while trying to logout\n', error);
		}
	}
</script>

<DropdownMenuItem onclick={handleLogout}>
	<LogoutIcon />
	Log out
</DropdownMenuItem>
