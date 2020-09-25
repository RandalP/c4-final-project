import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId

  // Return a presigned URL to upload a file for a TODO item with the provided id
  const uploadUrl = await updateUrl(userId, todoId)

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

async function updateUrl(userId: string, todoId: string): Promise<string> {

  const uploadUrl = s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })

  const attachmentUrl = 'https://' + bucketName + '.s3.amazonaws.com/' + todoId

  console.log("Image urls", { attachmentUrl, uploadUrl })

  // Update todo
  const todo = await docClient.update({
    TableName: todoTable,
    Key: {
      userId, todoId
    },
    UpdateExpression: "set attachmentUrl = :attachmentUrl",
    ExpressionAttributeValues: {
      ":attachmentUrl": attachmentUrl
    },
    ReturnValues: "UPDATED_NEW"
  }).promise()

  console.log("Updated url for todo", todo)

  return uploadUrl
}