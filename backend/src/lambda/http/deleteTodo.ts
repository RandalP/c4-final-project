import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { deleteTodoItem } from '../../businessLogic/todoItem'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId

  await deleteTodoItem(userId, todoId)

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
