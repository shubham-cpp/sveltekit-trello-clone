<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';

	type ColumnDndEvent = CustomEvent<DndEvent<(typeof columnItems)[0]>>;
	type TaskDndEvent = (
		cid: number,
		e: CustomEvent<
			DndEvent<{
				id: number;
				name: string;
			}>
		>
	) => void;

	let columnItems = $state([
		{
			id: 1,
			name: 'TODO',
			items: [
				{ id: 41, name: 'item41' },
				{ id: 42, name: 'item42' },
				{ id: 43, name: 'item43' },
				{ id: 44, name: 'item44' },
				{ id: 45, name: 'item45' },
				{ id: 46, name: 'item46' },
				{ id: 47, name: 'item47' },
				{ id: 48, name: 'item48' },
				{ id: 49, name: 'item49' }
			]
		},
		{
			id: 2,
			name: 'DOING',
			items: []
		},
		{
			id: 3,
			name: 'DONE',
			items: []
		}
	]);
	function handleDndConsiderColumns(e: ColumnDndEvent) {
		columnItems = e.detail.items;
	}
	function handleDndFinalizeColumns(e: ColumnDndEvent) {
		columnItems = e.detail.items;
	}
	const handleDndConsiderCards: TaskDndEvent = (cid, e) => {
		const colIdx = columnItems.findIndex((c) => c.id === cid);
		columnItems[colIdx].items = e.detail.items;
		columnItems = [...columnItems];
	};
	const handleDndFinalizeCards: TaskDndEvent = (cid, e) => {
		const colIdx = columnItems.findIndex((c) => c.id === cid);
		columnItems[colIdx].items = e.detail.items;
		columnItems = [...columnItems];
	};
	function handleClick(e: any) {
		alert('dragabble elements are still clickable :)');
	}
	const flipDurationMs = 150;
</script>

<section
	class="board"
	use:dndzone={{ items: columnItems, flipDurationMs, type: 'columns' }}
	onconsider={handleDndConsiderColumns}
	onfinalize={handleDndFinalizeColumns}
>
	{#each columnItems as column (column.id)}
		<div class="column" animate:flip={{ duration: flipDurationMs }}>
			<div class="column-title">{column.name}</div>
			<div
				class="column-content"
				use:dndzone={{ items: column.items, flipDurationMs }}
				onconsider={(e) => handleDndConsiderCards(column.id, e)}
				onfinalize={(e) => handleDndFinalizeCards(column.id, e)}
			>
				{#each column.items as item (item.id)}
					<button
						type="button"
						class="card"
						animate:flip={{ duration: flipDurationMs }}
						onclick={handleClick}
					>
						{item.name}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</section>

<style>
	.board {
		height: 90vh;
		width: 100%;
		padding: 0.5em;
		margin-bottom: 40px;
	}
	.column {
		height: 100%;
		width: 250px;
		padding: 0.5em;
		margin: 1em;
		float: left;
		border: 1px solid #333333;
		/*Notice we make sure this container doesn't scroll so that the title stays on top and the dndzone inside is scrollable*/
		overflow-y: hidden;
	}
	.column-content {
		height: 100%;
		border: 1px dotted orangered;
		/* Notice that the scroll container needs to be the dndzone if you want dragging near the edge to trigger scrolling */
		overflow-y: scroll;
	}
	.column-title {
		margin-bottom: 1em;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.card {
		height: 15%;
		width: 100%;
		margin: 0.4em 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #dddddd;
		color: #181818;
		border: 1px solid #333333;
	}
</style>
