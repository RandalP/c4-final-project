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
  const todos = await getTodos(userId)

  return {
    statusCode: 201,
    body: JSON.stringify({
      items: todos
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)

async function getTodos(userId: string) {
  const result = await docClient.query({
    TableName: todoTable,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false
  }).promise()

  return result.Items
}
