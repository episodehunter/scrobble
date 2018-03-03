import { guard, Logger } from '@episodehunter/kingsguard'
import { APIGatewayEvent } from 'aws-lambda'
import {
  plexPlaybackEventParse,
  plexMediaTypeParse,
  plexEpisodeParse
} from './parse.util'
import { OK_RESPONSE } from './response'

export const plex = guard<APIGatewayEvent>(
  (event: APIGatewayEvent, logger: Logger) => {
    logger.log('Going to scrobbler plex')
    const payload = event.body
    const username = event.queryStringParameters.username
    const apiKey = event.queryStringParameters.key
    logger.log(`Username: ${username}. Apikey: ${apiKey}`)

    const eventType = plexPlaybackEventParse(payload)

    if (eventType !== 'media.scrobble') {
      logger.log(`Do not support event type ${eventType} yet. Exit`)
      return OK_RESPONSE
    }

    const mediaType = plexMediaTypeParse(payload)

    if (mediaType !== 'episode') {
      logger.log(`Do not support media type ${mediaType} yet. Exit`)
      return OK_RESPONSE
    }

    const episodeInfo = plexEpisodeParse(payload)

    return {
      statusCode: '200',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(episodeInfo)
    }
  }
)
