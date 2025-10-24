import { command, form, getRequestEvent } from '$app/server'
import { taskQueries } from '$lib/server/db/queries'
import { addNewTaskSchema, moveTaskColumnSchema, updateTaskSortOrderSchema } from '$lib/zod-schemas'
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

export const updateTaskSortOrder = command(updateTaskSortOrderSchema, (data) => {
  const { locals, params } = getRequestEvent()

  const userId = locals.user?.id
  const boardId = params.id

  if (!boardId)
    return fail(401, { error: 'Board id is required' })
  if (!userId)
    return redirect(307, '/login')

  return taskQueries.updateSortOrder(userId, boardId, data.columnId, data.newSortOrder)
})
export const moveTaskColumn = command(moveTaskColumnSchema, async (data) => {
  const { locals, params } = getRequestEvent()

  const userId = locals.user?.id
  const boardId = params.id

  if (!boardId)
    return fail(401, { error: 'Board id is required' })
  if (!userId)
    return redirect(307, '/login')

  if (data.newSortOrder.findIndex(i => i.id === data.taskId) < 0) {
    return fail(401, { error: 'Invalid data is being passed.' })
  }

  return taskQueries.moveToColumn(userId, boardId, data.newColumnId, data.taskId, data.newSortOrder)
})
