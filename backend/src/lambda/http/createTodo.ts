import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from 'middy'
import { cors, warmup } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'
import { createTodoItem } from '../../businessLogic/todoItem'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  try {
    const userId = getUserId(event)
    const createTodoRequest: CreateTodoRequest = JSON.parse(event.body)
    const todoItem = await createTodoItem(createTodoRequest, userId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: todoItem
      })
    }
  }
  catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        item: err
      })
    }
  }
})

handler.use(
  cors({
    credentials: true
  })
).use(warmup())
