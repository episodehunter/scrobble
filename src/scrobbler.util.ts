import * as AWS from 'aws-sdk'
import { Message } from '@episodehunter/types'
import { EpisodeInformation } from './parse.util'
import { redKeep } from './red-keep.util'
import { UnauthorizedError, UnableToAddShowError } from './custom-error'
import { config } from './config'
import { Logger } from '@episodehunter/kingsguard';

AWS.config.update({
  region: 'us-east-1'
})

const lambda = new AWS.Lambda()

async function getUserId(username: string, apikey: string, requestId: string) {
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

async function createShow(theTvDbId: number): Promise<number> {
  return lambda
    .invoke({
      FunctionName: config.addShowFunctionName,
      Payload: JSON.stringify({ theTvDbId })
    })
    .promise()
    .then(snsResult => {
      if (!snsResult.Payload) {
        throw new Error(
          `Could not parse response from RedKeep. Payload is empty`
        )
      }
      const result = JSON.parse(snsResult.Payload.toString())
      const id = Number(result)
      if (id) {
        return id
      } else if (result.error === 'not-found') {
        throw new UnableToAddShowError(
          `Unknown show: '${JSON.stringify(snsResult)}'`
        )
      } else {
        throw new Error(
          `Could not parse response from RedKeep ${JSON.stringify(snsResult)}`
        )
      }
    })
}

async function createShowDragonstone(theTvDbId: number, requestId: string): Promise<string> {
  const event: Message.UpdateShow.AddShow.Event = { theTvDbId, requestStack: [requestId] }
  return lambda
    .invoke({
      FunctionName: config.addShowDragonstoneFunctionName,
      Payload: JSON.stringify(event)
    })
    .promise()
    .then(snsResult => {
      if (snsResult.FunctionError) {
        throw new UnableToAddShowError(snsResult.FunctionError)
      }
      if (!snsResult.Payload) {
        throw new Error(`Payload is empty: ${snsResult.LogResult}`)
      }
      const result: Message.UpdateShow.AddShow.Response = JSON.parse(snsResult.Payload.toString())
      return result.id
    })
}

async function getShowId(theTvDbId: number, requestId: string, log: Logger) {
  return redKeep.findShowId(theTvDbId, requestId).then(showId => {
    if (!showId) {
      createShowDragonstone(theTvDbId, requestId).then(id => log.log(`Added show to Dragonstone ${id}`)).catch(error => log.captureException(Object.assign(error, { awsRequestId: requestId })));
      return createShow(theTvDbId)
    }
    return showId
  })
}

export async function scrobbleEpisode(
  username: string,
  apikey: string,
  episodeInfo: EpisodeInformation,
  log: Logger,
  requestId: string
) {
  const userId = await getUserId(username, apikey, requestId)
  const showId = await getShowId(episodeInfo.id, requestId, log)
  return redKeep.scrobbleEpisode(
    {
      episode: episodeInfo.episode,
      season: episodeInfo.season,
      showId,
      userId
    },
    requestId
  )
}
