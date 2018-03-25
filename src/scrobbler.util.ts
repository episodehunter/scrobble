import * as AWS from 'aws-sdk'
import { EpisodeInformation } from './parse.util'
import { redKeep } from './red-keep.util'
import { UnauthorizedError, UnableToAddShowError } from './custom-error'

AWS.config.update({
  region: 'us-east-1'
})

const lambda = new AWS.Lambda()

function getUserId(username: string, apikey: string) {
  if (!username || !apikey) {
    return Promise.reject(
      new UnauthorizedError('You must provide both username and apikey')
    )
  }
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
