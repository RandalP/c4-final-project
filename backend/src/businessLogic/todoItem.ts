import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { TodoItemAccess } from '../dataLayer/todoItemAccess'
import { AttachmentAccess } from '../dataLayer/attachmentAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const attachmentAccess = new AttachmentAccess()
const todoItemAccess = new TodoItemAccess()

export async function getTodoItems(userId: string): Promise<TodoItem[]> {
  return todoItemAccess.getTodoItems(userId)
}

export async function createTodoItem(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {

  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()

  const newTodo = {
    userId,
    todoId,
    createdAt,
    done: false,
    ...createTodoRequest
  }

  console.log('Storing new TODO: ', newTodo)

  return await todoItemAccess.saveTodoItem(newTodo)
}

export async function deleteTodoItem(userId: string, todoId: string) {
  await todoItemAccess.deleteTodoItem(userId, todoId)
}

export async function updateTodoItem(userId: string, todoId: string, updateTodo: UpdateTodoRequest) {
  return await todoItemAccess.updateTodoItem(userId, todoId, updateTodo)
}

export async function updateUrls(userId: string, todoId: string): Promise<string> {
  // Retrieve the direct access URL and presigned upload URL for an image attachedto a TODO item
  const [attachmentUrl, uploadUrl] = attachmentAccess.getUrls(todoId)

  // Update the attachmentUrl
  await todoItemAccess.updateTodoAttachment(userId, todoId, attachmentUrl)

  return uploadUrl
}