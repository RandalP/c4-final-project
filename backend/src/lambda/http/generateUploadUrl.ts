import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { updateUrls } from '../../businessLogic/todoItem'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId

  const uploadUrl = await updateUrls(userId, todoId)

  return {
    statusCode: 201,
    body: JSON.stringify({
      uploadUrl
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)
