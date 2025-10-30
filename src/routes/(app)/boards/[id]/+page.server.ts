import type { Actions, PageServerLoad } from './$types'
import { boardQueries } from '$db/queries'
import { editBoardSchema } from '$lib/zod-schemas'
import { error, fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async (events) => {
  const { id: boardId } = events.params
  const userId = events?.locals?.user?.id

  if (!boardId)
    error(404, { message: 'ID is required parameter' })
  if (!userId)
    redirect(307, '/login')

  const board = await boardQueries.getWithColumnsAndTasksById(userId, boardId)

  if (!board)
    error(404, { message: 'No board found for this ID' })

  return { board }
}

export const actions: Actions = {
  updateBoard: async (event) => {
    const { params, locals, request } = event
    const userId = locals.user?.id
    const boardId = params.id

    if (!boardId)
      return fail(400, { error: 'Board id is required' })
    if (!userId)
      return redirect(307, '/login')

    const form = editBoardSchema.safeParse(request.formData)

    if (!form.success) {
      return fail(400, { form, error: 'Failed to update board.' })
    }

    const current = await boardQueries.getWithColumnsAndTasksById(userId, boardId)
    if (!current) {
      return fail(404, { form, error: 'Board not found.' })
    }
    const currentTitle = current.title?.trim() ?? ''
    const currentColor = current.color ?? null

    const newTitle = form.data.title.trim()
    const newColor = form.data.color

    if (currentTitle === newTitle && currentColor === newColor) {
      return fail(400, { form, error: 'No changes to update.' })
    }

    const updated = await boardQueries.updateById(userId, {
      id: boardId,
      title: form.data.title,
      color: form.data.color,
    })

    if (!updated) {
      return fail(500, { form, error: 'Failed to update board.' })
    }

    return { form }
  },

  deleteBoard: async (event) => {
    const { params, locals } = event
    const userId = locals.user?.id
    const boardId = params.id

    if (!boardId)
      return fail(400, { error: 'Board id is required' })
    if (!userId)
      return redirect(307, '/login')

    const deleted = await boardQueries.deleteById(userId, boardId)

    if (!deleted) {
      return fail(500, { error: 'Failed to delete board' })
    }

    redirect(303, '/dashboard')
  },
}
