import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { S3 } from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = createS3()

export class AttachmentAccess {
  constructor(
    private readonly bucketName: string = process.env.IMAGES_S3_BUCKET,
    private readonly urlExpiration: number = parseInt(process.env.SIGNED_URL_EXPIRATION)) {
  }

  getUrls(todoId: string): [string, string] {
    const uploadUrl = s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })

    const attachmentUrl = 'https://' + this.bucketName + '.s3.amazonaws.com/' + todoId

    console.log("Image urls", { attachmentUrl, uploadUrl })

    return [attachmentUrl, uploadUrl];
  }
}

function createS3(): S3 {
  const aws = (process.env.IS_OFFLINE ? AWS : XAWS)
  return new aws.S3({
    signatureVersion: 'v4'
  })
}
