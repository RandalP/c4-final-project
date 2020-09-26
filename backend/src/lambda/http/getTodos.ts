import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { getTodoItems } from '../../businessLogic/todoItem'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  const userId = getUserId(event)
  const todoItems = await getTodoItems(userId)

  return {
    statusCode: 201,
    body: JSON.stringify({
      items: todoItems
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)
