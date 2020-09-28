import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { TodoItemAccess } from '../dataLayer/todoItemAccess'
import { AttachmentAccess } from '../dataLayer/attachmentAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'

const attachmentAccess = new AttachmentAccess()
const todoItemAccess = new TodoItemAccess()
const logger = createLogger('todoItem')

export async function getTodoItems(userId: string): Promise<TodoItem[]> {
  try {
    const todoItems = todoItemAccess.getTodoItems(userId)
    logger.info("Get TODO items succeeded.", todoItems);
    return todoItems
  }
  catch (err) {
    logger.error("Unable to get TODO items.", err);
    throw err
  }
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

  try {
    const todoItem = await todoItemAccess.saveTodoItem(newTodo)
    logger.info("Save TODO item succeeded.", todoItem);
    return todoItem
  }
  catch (err) {
    logger.error("Unable to save TODO item.", { todoItem: newTodo, err });
    throw err
  }
}

export async function deleteTodoItem(userId: string, todoId: string) {
  try {
    await todoItemAccess.deleteTodoItem(userId, todoId)
    logger.info("Delete TODO item succeeded.", { userId, todoId });
  }
  catch (err) {
    logger.error("Unable to delete TODO item.", { userId, todoId, err });
    throw err
  }
}

export async function updateTodoItem(userId: string, todoId: string, updateTodo: UpdateTodoRequest) {
  try {
    const result = await todoItemAccess.updateTodoItem(userId, todoId, updateTodo)
    logger.info("Update of TODO item succeeded.", result);
  }
  catch (err) {
    logger.error("Unable to update TODO item.", { userId, todoId, err });
    throw err
  }
}

export async function updateUrls(userId: string, todoId: string): Promise<string> {
  try {
    // Retrieve the direct access URL and presigned upload URL for an image attached to a TODO item
    const [attachmentUrl, uploadUrl] = attachmentAccess.getUrls(todoId)
    logger.info("Created upload URL for TODO attachment.", { userId, todoId, attachmentUrl, uploadUrl });

    // Update the attachmentUrl
    await todoItemAccess.updateTodoAttachment(userId, todoId, attachmentUrl)
    logger.info("Updated URL for TODO succeeded.", { userId, todoId, attachmentUrl });

    return uploadUrl
  }
  catch (err) {
    logger.error("Unable to update URL TODO.", { userId, todoId, err });
    throw err
  }
}