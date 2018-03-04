import { guard, Logger, assertRequiredConfig } from '@episodehunter/kingsguard'
import { APIGatewayEvent } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import { parse } from 'aws-lambda-multipart-parser'
import { createUnauthorizedOkResponse, createOkResponse } from './response'
import { PlexEvent } from './types'
import { plexEpisodeParse, EpisodeInformation } from './parse.util'
import { redKeep } from './red-keep.util'
import { UnauthorizedError, UnableToAddShowError } from './custom-error'

AWS.config.update({
  region: 'us-east-1'
})

const lambda = new AWS.Lambda()

assertRequiredConfig(
  'ADD_SHOW_FUNCTION',
  'EH_RED_KEEP_URL',
  'EH_RED_KEEP_TOKEN'
)

function getUserId(username: string, apikey: string) {
  return redKeep.findUserId({ apikey, username }).then(userId => {
    if (!userId) {
      throw new UnauthorizedError('Can not find user with given credentials')
    }
    return userId
  })
}

function createShow(theTvDbId: number): Promise<number> {
  return lambda
    .invoke({
      FunctionName: process.env.ADD_SHOW_FUNCTION,
      Payload: JSON.stringify({ theTvDbId })
    })
    .promise()
    .catch(error => {
      return Promise.reject(
        new UnableToAddShowError('UnableToAddShowError', error)
      )
    })
    .then(result => {
      const id = Number(result.Payload)
      if (!id) {
        throw new UnableToAddShowError(`Id is falsy: '${result}'`)
      }
      return id
    })
}

function getShowId(theTvDbId: number) {
  return redKeep.findShowId(theTvDbId).then(showId => {
    if (!showId) {
      return createShow(theTvDbId)
    }
    return showId
  })
}

export function scrobbleEpisode(
  username: string,
  apikey: string,
  episodeInfo: EpisodeInformation
) {
  return getUserId(username, apikey)
    .then(userId =>
      getShowId(episodeInfo.id).then(showId => ({
        userId,
        showId
      }))
    )
    .then(({ userId, showId }) =>
      redKeep.scrobbleEpisode({
        episode: episodeInfo.episode,
        season: episodeInfo.season,
        showId,
        userId
      })
    )
}

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
        `Sorry, I do not accept special episodes at the moment`
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
