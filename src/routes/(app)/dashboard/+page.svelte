<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="mb-6 sm:mb-8">
	<h1>Welcome Back, {data.user.name}</h1>
	<p class="text-primary-foreground/80">
		Here&apos;s what&apos;s happening with your boards today.
	</p>
</div>
