import * as AWS from 'aws-sdk'
import { EpisodeInformation } from './parse.util'
import { redKeep } from './red-keep.util'
import { UnauthorizedError, UnableToAddShowError } from './custom-error'
import { config } from './config'

AWS.config.update({
  region: 'us-east-1'
})

const lambda = new AWS.Lambda()

function getUserId(username: string, apikey: string, requestId: string) {
  if (!username || !apikey) {
    return Promise.reject(
      new UnauthorizedError('You must provide both username and apikey')
    )
  }
  return redKeep.findUserId({ apikey, username }, requestId).then(userId => {
    if (!userId) {
      throw new UnauthorizedError('Can not find user with given credentials')
    }
    return userId
  })
}

function createShow(theTvDbId: number): Promise<number> {
  return lambda
    .invoke({
      FunctionName: config.addShowFunctionName,
      Payload: JSON.stringify({ theTvDbId })
    })
    .promise()
    .then(snsResult => {
      const result = JSON.parse(snsResult.Payload.toString())
      const id = Number(result)
      if (id) {
        return id
      } else if (result.error === 'not-found') {
        throw new UnableToAddShowError(
          `Unknown show: '${JSON.stringify(snsResult)}'`
        )
      } else {
        throw new Error(`Could not parse response from RedKeep ${JSON.stringify(snsResult)}`)
      }
    })
}

function getShowId(theTvDbId: number, requestId: string) {
  return redKeep.findShowId(theTvDbId, requestId).then(showId => {
    if (!showId) {
      return createShow(theTvDbId)
    }
    return showId
  })
}

export function scrobbleEpisode(
  username: string,
  apikey: string,
  episodeInfo: EpisodeInformation,
  requestId: string
) {
  return getUserId(username, apikey, requestId)
    .then(userId =>
      getShowId(episodeInfo.id, requestId).then(showId => ({
        userId,
        showId
      }))
    )
    .then(({ userId, showId }) =>
      redKeep.scrobbleEpisode(
        {
          episode: episodeInfo.episode,
          season: episodeInfo.season,
          showId,
          userId
        },
        requestId
      )
    )
}
