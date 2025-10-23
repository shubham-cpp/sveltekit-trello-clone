import { form, getRequestEvent } from '$app/server'
import { taskQueries } from '$lib/server/db/queries'
import { addNewTaskSchema } from '$lib/zod-schemas'
import { fail, redirect } from '@sveltejs/kit'

export const createTask = form(
  addNewTaskSchema,
  async ({
    title,
    description = null,
    priority,
    sort_order,
    due_date,
    assignee,
    targetColumnId,
  }) => {
    const { locals, params } = getRequestEvent()
    const userId = locals.user?.id
    const boardId = params.id
    if (!boardId)
      return fail(401, { error: 'Board id is required' })
    if (!userId)
      return redirect(307, '/login')

    const newTask = await taskQueries.create(userId, boardId, targetColumnId, {
      title,
      description,
      due_date: new Date(due_date),
      assignee,
      priority,
      sort_order,
    })

    if (!newTask) {
      return fail(401, { error: 'Failed to create new task.' })
    }
    return { status: 201, message: 'New Task created successfully.' }
  },
)
