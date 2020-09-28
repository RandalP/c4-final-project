import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from 'middy'
import { cors, warmup } from 'middy/middlewares'
import { getUserId } from '../utils'
import { updateUrls } from '../../businessLogic/todoItem'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  try {
    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId

    const uploadUrl = await updateUrls(userId, todoId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl
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
