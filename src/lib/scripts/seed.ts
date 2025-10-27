import { auth } from '$lib/server/auth'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { COLOR_VALUES, PRIORITY_VALUES } from '$lib/zod-schemas'
import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'

interface ReturnType {
  tableName: string
  createdCount: number
}

export default async function dbSeed(): Promise<ReturnType[]> {
  const results: ReturnType[] = []

  console.log('Creating users...')
  const userPromises: Promise<any>[] = []
  for (let i = 0; i < 10; i++) {
    userPromises.push(auth.api.signUpEmail({
      body: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        image: faker.image.avatarGitHub(),
        password: 'password',
      },
    }))
  }
  await Promise.all(userPromises)
  results.push({ tableName: 'user', createdCount: 10 })

  const users = await db.query.user.findMany({
    with: { memberships: { with: { organization: true } } },
  })

  console.log('Seeding boards, columns, and tasks...')

  const boardPromises: Promise<any>[] = []
  const columnPromises: Promise<any>[] = []
  const taskPromises: Promise<any>[] = []

  for (let i = 0; i < 15; i++) {
    const randomUser = faker.helpers.arrayElement(users)
    if (!randomUser.memberships || randomUser.memberships.length === 0) {
      console.warn(`User ${randomUser.id} has no organizations, skipping board creation`)
      continue
    }

    const organization = randomUser.memberships[0].organization

    const boardId = nanoid()
    const boardCreatedAt = faker.date.past({ years: 1 })
    const boardUpdatedAt = faker.date.between({ from: boardCreatedAt, to: new Date() })
    boardPromises.push(
      db.insert(schema.board).values({
        id: boardId,
        title: faker.company.name(),
        description: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.7 }),
        userId: randomUser.id,
        organizationId: organization.id,
        color: faker.helpers.arrayElement(COLOR_VALUES),
        isDeleted: false,
        createdAt: boardCreatedAt,
        updatedAt: boardUpdatedAt,
      }),
    )

    const columnCount = faker.number.int({ min: 3, max: 5 })
    const columnIds: string[] = []

    for (let j = 0; j < columnCount; j++) {
      const columnId = nanoid()
      columnIds.push(columnId)

      const columnCreatedAt = faker.date.between({ from: boardCreatedAt, to: new Date() })
      const columnUpdatedAt = faker.date.between({ from: columnCreatedAt, to: new Date() })
      columnPromises.push(
        db.insert(schema.boardColumn).values({
          id: columnId,
          title: faker.helpers.arrayElement([
            'Backlog',
            'To Do',
            'In Progress',
            'In Review',
            'Testing',
            'Done',
            'Blocked',
            'On Hold',
            'Planning',
            'Ready for Dev',
            'Ready for QA',
          ]),
          sort_order: j,
          boardId,
          createdAt: columnCreatedAt,
          updatedAt: columnUpdatedAt,
        }),
      )

      const taskCount = faker.number.int({ min: 2, max: 8 })

      for (let k = 0; k < taskCount; k++) {
        const taskCreatedAt = faker.date.between({ from: columnCreatedAt, to: new Date() })
        const taskUpdatedAt = faker.date.between({ from: taskCreatedAt, to: new Date() })
        taskPromises.push(
          db.insert(schema.task).values({
            id: nanoid(),
            title: faker.helpers.arrayElement([
              `${faker.hacker.verb()} ${faker.hacker.noun()}`,
              `${faker.hacker.ingverb()} ${faker.hacker.noun()}`,
              faker.lorem.sentence(3),
              `Fix ${faker.hacker.noun()} bug`,
              `Implement ${faker.hacker.noun()} feature`,
              `Update ${faker.hacker.noun()} documentation`,
              `Refactor ${faker.hacker.noun()} module`,
              `Test ${faker.hacker.noun()} functionality`,
            ]),
            description: faker.helpers.maybe(() => faker.lorem.paragraphs(2), { probability: 0.8 }),
            sort_order: k,
            due_date: faker.helpers.maybe(() => faker.date.future(), { probability: 0.7 }),
            priority: faker.helpers.arrayElement(PRIORITY_VALUES),
            owner: randomUser.id,
            assignee: faker.helpers.maybe(() => faker.helpers.arrayElement(users).id, { probability: 0.6 }),
            boardId,
            boardColumnId: columnId,
            createdAt: taskCreatedAt,
            updatedAt: taskUpdatedAt,
          }),
        )
      }
    }
  }

  await Promise.all(boardPromises)
  await Promise.all(columnPromises)
  await Promise.all(taskPromises)

  const boardCount = await db.query.board.findMany().then(boards => boards.length)
  const columnCount = await db.query.boardColumn.findMany().then(columns => columns.length)
  const taskCount = await db.query.task.findMany().then(tasks => tasks.length)

  results.push(
    { tableName: 'board', createdCount: boardCount },
    { tableName: 'boardColumn', createdCount: columnCount },
    { tableName: 'task', createdCount: taskCount },
  )

  return results
}
