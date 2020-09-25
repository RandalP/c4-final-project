import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId

  console.log("Attempting to delete Todo", { userId, todoId })

  // Remove a TODO item by id
  docClient.delete(
    {
      TableName: todoTable,
      Key: {
        userId,
        todoId
      }
    },
    function (err, data) {
      if (err) {
        console.error("Unable to delete TODO. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.log("Delete TODO succeeded:", JSON.stringify(data, null, 2));
      }
    }
  )
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
