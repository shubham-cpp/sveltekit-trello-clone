<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { signupSchema, type SignUpFormSchema } from '$lib/zod-schemas';
	import { superForm, type Infer } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';

	let { data } = $props();

	const form = superForm<Infer<SignUpFormSchema>>(data.form, {
		validators: zodClient(signupSchema),
		onResult: async ({ result }) => {
			if (result.type !== 'success') return;
			try {
				const { firstName, lastName, email, password } = get(formData);

				const { error } = await authClient.signUp.email({
					name: `${firstName} ${lastName}`,
					email,
					password
				});
				if (error?.message) throw new Error(error?.message);

				await goto('/login');
			} catch (err) {
				console.error('Sign up failed', err);
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
	<div class="grid grid-cols-2 gap-3">
		<Form.Field {form} name="firstName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>First Name</Form.Label>
					<Input {...props} bind:value={$formData.firstName} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="lastName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Last Name</Form.Label>
					<Input {...props} bind:value={$formData.lastName} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} type="email" bind:value={$formData.email} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Password</Form.Label>
				<Input {...props} type="password" bind:value={$formData.password} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button class="w-full">Submit</Form.Button>
</form>
