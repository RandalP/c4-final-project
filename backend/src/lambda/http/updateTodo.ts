import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from 'middy'
import { cors, warmup } from 'middy/middlewares'
import { getUserId } from '../utils'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { updateTodoItem } from '../../businessLogic/todoItem'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  try {
    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId
    const updateTodoRequest: UpdateTodoRequest = JSON.parse(event.body)

    updateTodoItem(userId, todoId, updateTodoRequest)

    return {
      statusCode: 204,
      body: undefined
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
