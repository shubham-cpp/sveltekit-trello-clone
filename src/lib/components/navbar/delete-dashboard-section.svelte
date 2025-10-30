<script lang='ts'>
  import { Button, buttonVariants } from '$lib/components//ui/button'
  import * as AlertDialog from '$ui/alert-dialog'
</script>

<section class='mt-6 border-t pt-4'>
  <h3 class='text-sm font-medium text-destructive'>Danger zone</h3>
  <p class='mt-1 text-xs text-foreground/70'>
    Deleting will move this board to Trash. You can restore it from Trash, or delete it forever there.
  </p>

  <div class='mt-3'>
    <AlertDialog.Root>
      <AlertDialog.Trigger class={[buttonVariants({ variant: 'destructive' }), `
        cursor-pointer
      `]}>
        Delete board
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete this board?</AlertDialog.Title>
          <AlertDialog.Description>
            This action will move the board to Trash. You can restore it later from the Trash page.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer class='flex items-center gap-2'>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <form method='POST' action='?/deleteBoard'>
            <Button type='submit' variant='destructive'>
              Confirm delete
            </Button>
          </form>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
  </div>
</section>
