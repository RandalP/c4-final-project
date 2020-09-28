import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)
const DynamoDbPort = process.env.DYNAMO_DB_PORT

export class TodoItemAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly TodoTable = process.env.TODO_TABLE) {
  }

  async getTodoItems(userId: string): Promise<TodoItem[]> {
    console.log('Getting all Todos')

    const result = await this.docClient.query({
      TableName: this.TodoTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()

    return result.Items as TodoItem[]
  }

  async saveTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.TodoTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  async deleteTodoItem(userId: string, todoId: string) {
    console.log("Attempting to delete Todo", { userId, todoId })

    // Remove a TODO item by id
    await this.docClient.delete(
      {
        TableName: this.TodoTable,
        Key: {
          userId,
          todoId
        }
      }
    ).promise()
  }

  async updateTodoItem(userId: string, todoId: string, updateTodo: UpdateTodoRequest): Promise<any> {
    // NB: 'name' is a keyword, so it needs to be mapped via ExpressionAttributeNames
    return this.docClient.update(
      {
        TableName: this.TodoTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: "set #name = :name, dueDate = :dueDate, done = :done",
        ExpressionAttributeValues: {
          ":name": updateTodo.name,
          ":dueDate": updateTodo.dueDate,
          ":done": updateTodo.done
        },
        ExpressionAttributeNames: {
          "#name": "name"
        },
        ReturnValues: "UPDATED_NEW"
      }
    ).promise()
  }

  async updateTodoAttachment(userId: string, todoId: string, attachmentUrl: string) {
    // Update the attachment URL for am existing TODO item.
    await this.docClient.update({
      TableName: this.TodoTable,
      Key: {
        userId, todoId
      },
      UpdateExpression: "set attachmentUrl = :attachmentUrl",
      ExpressionAttributeValues: {
        ":attachmentUrl": attachmentUrl
      },
      ReturnValues: "UPDATED_NEW"
    }).promise()
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: `http://localhost:${DynamoDbPort}`
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
