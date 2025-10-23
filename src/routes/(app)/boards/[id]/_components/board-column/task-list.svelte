<script lang='ts'>
  import type { BoardColumnWithTask } from '$lib/server/db/types'

  interface TaskListProps {
    tasks: BoardColumnWithTask['tasks']
  }

  const { tasks }: TaskListProps = $props()
</script>

{#each tasks as task (task.id)}
  <p>{task.title}</p>
{/each}
