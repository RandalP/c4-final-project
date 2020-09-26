import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// URL to download certificates comes from Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-1covnje7.au.auth0.com/.well-known/jwks.json'

let savedKeys = undefined

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)

  let user = 'user'
  let effect = 'Deny'

  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    user = jwtToken.sub
    effect = 'Allow'
    logger.info('User was authorized', jwtToken)
  } catch (e) {
    logger.error('User not authorized', { error: e.message })
  }
  finally {
    return {
      principalId: user,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  const validKeys = await getValidKeys()

  // Find key with same key id as token
  const key = validKeys.find(key => key.kid === jwt.header.kid)

  // Convert X509 certificate info to Certificate
  const secret = certToPEM(key.x5c[0])

  return verify(token, secret, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

async function getValidKeys(): Promise<any[]> {
  if (!savedKeys) {
    // Retrieve keys from Auth0
    let response = await Axios.get(jwksUrl)
    const keys = response.data.keys

    if (!keys || !keys.length) {
      throw new Error('The JWKS endpoint did not contain any keys');
    }

    // Cache keys which are valid for RS256
    savedKeys = keys.filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signature verification
      && key.kty === 'RSA' // We are only supporting RSA (RS256)
      && key.kid           // The `kid` must be present to be useful for later
      && (key.x5c && key.x5c.length) // Has useful public keys
    )
  }
  return savedKeys
}

function certToPEM(cert: string): string {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}
