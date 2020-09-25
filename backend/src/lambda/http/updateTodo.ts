import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import * as AWS from 'aws-sdk'
import middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  // Update a TODO item with the provided id using values in the "updatedTodo" object
  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  docClient.update(
    {
      TableName: todoTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: "set #name = :name, dueDate = :dueDate, done = :done",
      ExpressionAttributeValues: {
        ":name": updatedTodo.name,
        ":dueDate": updatedTodo.dueDate,
        ":done": updatedTodo.done
      },
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ReturnValues: "UPDATED_NEW"
    },
    function (err, data) {
      if (err) {
        console.error("Unable to update TODO. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.log("Update TODO succeeded:", JSON.stringify(data, null, 2));
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
