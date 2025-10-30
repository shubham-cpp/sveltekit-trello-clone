import { form, getRequestEvent } from '$app/server'
import { boardQueries } from '$db/queries'
import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod/v4'

const boardIdSchema = z.object({
  boardId: z.string().min(1, 'Invalid board id'),
})

/**
 * Restore a soft-deleted board back to active state.
 * Redirects back to /dashboard/trashed after completion to refresh the list.
 */
export const restoreBoard = form(boardIdSchema, async ({ boardId }) => {
  const { locals } = getRequestEvent()
  const userId = locals.user?.id

  if (!userId) {
    return redirect(307, '/login')
  }

  try {
    const restored = await boardQueries.unDeleteById(userId, boardId)
    if (!restored) {
      return fail(400, { error: 'Board not found or not deleted' })
    }

    return { status: 204, message: `Board - ${restored.title} has been successfully restored.` }
  }
  catch (error) {
    console.error('Error restoring board:', error)
    return fail(500, { error: 'Failed to restore board' })
  }
})

/**
 * Permanently delete a soft-deleted board.
 * Redirects back to /dashboard/trashed after completion to refresh the list.
 */
export const deleteBoardForever = form(boardIdSchema, async ({ boardId }) => {
  const { locals } = getRequestEvent()
  const userId = locals.user?.id

  if (!userId) {
    return redirect(307, '/login')
  }

  try {
    const ok = await boardQueries.deletePermanentlyById(userId, boardId)
    if (!ok) {
      return fail(400, { error: 'Board not found or not deleted' })
    }
    return { status: 204, message: `Board has been successfully deleted forever.` }
  }
  catch (error) {
    console.error('Error permanently deleting board:', error)
    return fail(500, { error: 'Failed to delete board' })
  }
})
