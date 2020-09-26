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
      .then((data) => {
        console.log("Save TODO succeeded:", JSON.stringify(data, null, 2));
      }, (err) => {
        console.error("Unable to save TODO. Error JSON:", JSON.stringify(err, null, 2));
      })

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
      .then((data) => {
        console.log("Delete TODO succeeded:", JSON.stringify(data, null, 2));
      }, (err) => {
        console.error("Unable to delete TODO. Error JSON:", JSON.stringify(err, null, 2));
      })
  }

  async updateTodoItem(userId: string, todoId: string, updateTodo: UpdateTodoRequest) {
    // NB: 'name' is a keyword, so it needs to be mapped via ExpressionAttributeNames
    this.docClient.update(
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
      .then((data) => {
        console.log("Update TODO succeeded:", JSON.stringify(data, null, 2));
      }, (err) => {
        console.error("Unable to update TODO. Error JSON:", JSON.stringify(err, null, 2));
      })
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
      .then((data) => {
        console.log("Updated URL for TODO:", JSON.stringify(data, null, 2));
      }, (err) => {
        console.error("Failed to update URL for TODO. Error JSON:", JSON.stringify(err, null, 2));
      })
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
