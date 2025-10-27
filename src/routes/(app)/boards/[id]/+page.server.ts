import type { Actions, PageServerLoad } from './$types'
import { boardQueries } from '$lib/server/db/queries'
import { addNewTaskSchema, editBoardSchema } from '$lib/zod-schemas'
import { error, redirect } from '@sveltejs/kit'
import { fail, superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'

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

  return { board, form: await superValidate(zod(addNewTaskSchema), { id: 'add-new-task-form' }) }
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

    const form = await superValidate(request, zod(editBoardSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    const updated = await boardQueries.updateById(userId, {
      id: boardId,
      title: form.data.title,
      color: form.data.color,
    })

    if (!updated) {
      return fail(500, { form, error: 'Failed to update board' })
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
  // addNewTask: async (event) => {
  //   // addNewTask action invoked
  //   const { params, locals, request } = event
  //   const userId = locals.user?.id
  //   const boardId = params.id

  //   if (!boardId)
  //     return fail(401, { error: 'Board id is required' })
  //   if (!userId)
  //     return redirect(307, '/login')

  //   const form = await superValidate(request, zod(addNewTaskSchema), { id: 'add-new-task-form' })

  //   if (!form.valid) {
  //     return fail(401, { form })
  //   }

  //   try {
  //     const { title, priority = 'medium', description = null, due_date, assignee } = form.data
  //     const newTask = await taskQueries.create(userId, boardId, form.data.targetColumnId, {
  //       title,
  //       description,
  //       due_date,
  //       assignee,
  //       priority,
  //       sort_order: 0,
  //     })

  //     if (!newTask) {
  //       return fail(401, { error: 'Failed to create new task.' })
  //     }

  //     return { form }
  //   }
  //   catch {
  //     return fail(500, { form })
  //   }
  // },
}
