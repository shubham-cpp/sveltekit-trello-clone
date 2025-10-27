<script lang='ts'>
  import type { PageProps } from "./$types";


  const { data }:PageProps = $props()
</script>
<h1>SEED DATABASE</h1>

{#if data.error}
  <p class='my-8 text-xl text-destructive'>Error while seeding database</p>
  <pre>{JSON.stringify(data.error, null, 2)}</pre>

{:else}

  <div class='relative overflow-x-auto'>
    <table class='
      w-full text-left text-sm text-gray-500
      rtl:text-right
      dark:text-gray-400
    '>
      <thead class='
        bg-gray-50 text-xs text-gray-700 uppercase
        dark:bg-gray-700 dark:text-gray-400
      '>
        <tr>
          <th scope='col' class='px-6 py-3'>
            Table name
          </th>
          <th scope='col' class='px-6 py-3'>
            Created Count
          </th>
        </tr>
      </thead>
      <tbody>
        {#each data.result as item (item.tableName)}
          <tr class='
            border-b border-gray-200 bg-white
            dark:border-gray-700 dark:bg-gray-800
          '>
            <th scope='row' class='
              px-6 py-4 font-medium whitespace-nowrap text-gray-900
              dark:text-white
            '>
              {item.tableName}
            </th>
            <td class='px-6 py-4'>
              {item.createdCount}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
