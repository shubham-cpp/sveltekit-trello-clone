import { z } from 'zod/v4'

export const PRIORITY_VALUES = ['low', 'medium', 'high'] as const

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
})
export type LoginFormSchema = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
export type SignUpFormSchema = z.infer<typeof signupSchema>

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
})
export type ProfileUpdateFormSchema = typeof profileUpdateSchema

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords don\'t match',
    path: ['confirmPassword'],
  })
export type PasswordChangeFormSchema = typeof passwordChangeSchema

export const COLOR_VALUES = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-sky-600',
  'bg-indigo-600',
  'bg-green-600',
]

export const editBoardSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  color: z.enum(COLOR_VALUES),
})
export type EditBoardFormSchema = z.infer<typeof editBoardSchema>

export const addNewTaskSchema = z.object({
  title: z.string().trim().min(3, 'Title should at least have 3 characters.').max(96),
  description: z.string().trim().optional(),

  priority: z.enum(PRIORITY_VALUES).default('medium'),
  sort_order: z.uint32().default(0),
  due_date: z.iso.date(),

  assignee: z.string().min(6, 'Not a valid assignee.').max(56),
  targetColumnId: z.string().min(6, 'Not a valid column id.').max(56),
})
export type AddNewTaskSchema = z.infer<typeof addNewTaskSchema>

export const updateTaskSortOrderSchema = z.object({
  columnId: z.string().min(6, 'Invalid column id passed.').max(56),
  newSortOrder: z.array(z.object({
    id: z.string().min(6, 'Invalid id passed.').max(56),
    newIndex: z.uint32(),
  })),
})
export type UpdateTaskSortOrderSchema = z.infer<typeof updateTaskSortOrderSchema>

export const moveTaskColumnSchema = z.object({
  newColumnId: z.string().min(6, 'Invalid column id passed.').max(56),
  taskId: z.string().min(6, 'Invalid task id passed.').max(56),
  newSortOrder: z.array(z.object({
    id: z.string().min(6, 'Invalid id passed.').max(56),
    newIndex: z.uint32(),
  })),
})
export type MoveTaskColumnSchema = z.infer<typeof moveTaskColumnSchema>
