import { guard, Logger, assertRequiredConfig } from '@episodehunter/kingsguard'
import { APIGatewayEvent } from 'aws-lambda'
import { parse } from 'aws-lambda-multipart-parser'
import {
  createUnauthorizedOkResponse,
  createOkResponse,
  createBadRequestResponse
} from './response'
import { PlexEvent, KodiEpisodeEvent, KodiMovieEvent } from './types'
import { plexEpisodeParse, parseJson, isKodiEpisode } from './parse.util'
import { UnauthorizedError } from './custom-error'
import { scrobbleEpisode } from './scrobbler.util'

assertRequiredConfig(
  'ADD_SHOW_FUNCTION',
  'EH_RED_KEEP_URL',
  'EH_RED_KEEP_TOKEN'
)

export const plex = guard<APIGatewayEvent>(
  (event: APIGatewayEvent, logger: Logger) => {
    const username = event.queryStringParameters.username
    const apikey = event.queryStringParameters.key
    const payload: PlexEvent = JSON.parse(parse(event, true).payload)
    const eventType = payload.event
    const mediaType = payload.Metadata.type
    const episodeInfo = plexEpisodeParse(payload.Metadata.guid)

    logger.log(`
      Going to scrobbler for plex.
      Username: ${username}
      Apikey: ${apikey}
      Event type: ${eventType}
      Media type: ${mediaType}
      Provider: ${episodeInfo && episodeInfo.provider}
      id: ${episodeInfo && episodeInfo.id}
      season: ${episodeInfo && episodeInfo.season}
      episode: ${episodeInfo && episodeInfo.episode}
    `)

    if (eventType !== 'media.scrobble') {
      return createOkResponse(
        `Do not support event type ${eventType} yet. Exit`
      )
    }

    if (mediaType !== 'episode') {
      return createOkResponse(
        `Do not support media type ${mediaType} yet. Exit`
      )
    }

    if (!episodeInfo) {
      logger.captureException(new Error('episodeInfo is null'))
      return createOkResponse(`Was not able to parse episode information`)
    }

    if (!episodeInfo.episode || !episodeInfo.season) {
      return createOkResponse(
        `Sorry, episodehunter do not accept special episodes at the moment`
      )
    }

    return scrobbleEpisode(username, apikey, episodeInfo)
      .then(() => createOkResponse('OK'))
      .catch(error => {
        if (error instanceof UnauthorizedError) {
          return Promise.resolve(createUnauthorizedOkResponse(error.message))
        }
        return Promise.reject(error)
      })
  }
)

export const kodi = guard<APIGatewayEvent>(
  (rawEvent: APIGatewayEvent, logger: Logger) => {
    const event: KodiEpisodeEvent | KodiMovieEvent = parseJson(rawEvent.body)
    if (!event) {
      logger.captureBreadcrumb({
        message: 'Unable to parse json',
        data: rawEvent.body as any,
        category: 'parse'
      })
      logger.captureException(new Error('Unable to parse json'))
      return createBadRequestResponse('Unable to parse body')
    }

    if (!isKodiEpisode(event)) {
      return createOkResponse(`Do not support movies yet. Exit`)
    }

    logger.log(`
      Going to scrobbler for kodi.
      Username: ${event.username}
      Apikey: ${event.apikey}
      id: ${event.tvdbId}
      season: ${event.season}
      episode: ${event.episode}
    `)

    if (event.eventType !== 'scrobble') {
      return createOkResponse(
        `Do not support event type ${event.eventType} yet. Exit`
      )
    }

    if (!event.tvdbId || !event.episode || !event.season) {
      return createOkResponse(
        `Sorry, episodehunter do not accept special episodes at the moment`
      )
    }

    return scrobbleEpisode(event.username, event.apikey, {
      episode: event.episode,
      season: event.season,
      id: Number(event.tvdbId),
      provider: 'thetvdb'
    })
      .then(() => createOkResponse('OK'))
      .catch(error => {
        if (error instanceof UnauthorizedError) {
          return Promise.resolve(createUnauthorizedOkResponse(error.message))
        }
        return Promise.reject(error)
      })
  }
)
