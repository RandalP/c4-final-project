import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'
import { createTodoItem } from '../../businessLogic/todoItem'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  const createTodoRequest: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event)
  const todoItem = await createTodoItem(createTodoRequest, userId)

  return {
    statusCode: 201,
    body: JSON.stringify({
      item: todoItem
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)
