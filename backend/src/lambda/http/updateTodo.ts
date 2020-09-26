import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { TodoItemAccess } from '../../dataLayer/todoItemAccess'

const todoItemAccess = new TodoItemAccess()

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId
  const updateTodoRequest: UpdateTodoRequest = JSON.parse(event.body)

  todoItemAccess.updateTodoItem(userId, todoId, updateTodoRequest)

  return {
    statusCode: 204,
    body: undefined
  }
})

handler.use(
  cors({
    credentials: true
  })
)
