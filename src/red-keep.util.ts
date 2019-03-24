import { GraphQLClient } from 'graphql-request'
import { config } from './config'

interface ScrobbleEpisodeInput {
  userId: number
  showId: number
  season: number
  episode: number
}

interface FindUserInput {
  username: string
  apikey: string
}

const client = new GraphQLClient(config.ehRedKeepUrl, {
  headers: { 'api-key': config.redKeepApiKey }
})

class RedKeepError extends Error {
  constructor(msg: string, extra: Object) {
    super(msg)
    ;(this as any).extra = extra
  }
}

function handleError(error: any) {
  if (
    error &&
    error.response &&
    error.response.errors &&
    error.response.errors.length
  ) {
    return Promise.reject(
      new RedKeepError(error.response.errors[0].message, error)
    )
  }
  return Promise.reject(error)
}

export function scrobbleEpisode(
  episodeInput: ScrobbleEpisodeInput,
  requestId: string
) {
  const query = `
    mutation ScrobbleEpisode($episodeInput: ScrobbleEpisodeInput!) {
      scrobbleEpisode(episode: $episodeInput) {
        result
      }
    }
  `
  client.setHeader('request-id', requestId)
  return client
    .request<{ scrobbleEpisode: { result: boolean } }>(query, { episodeInput })
    .then(result => result.scrobbleEpisode)
    .catch(handleError)
}

export function findUserId(userInput: FindUserInput, requestId: string) {
  const query = `
    query FindUser($userInput: FindApiUserInput!) {
      findApiUser(user: $userInput) {
        id
      }
    }
  `
  client.setHeader('request-id', requestId)
  return client
    .request<{ findApiUser: { id: number | null } }>(query, { userInput })
    .then(result => result.findApiUser.id)
    .catch(handleError)
}

export function findShowId(tvdbId: number, requestId: string) {
  const query = `
    query FindShowId($tvdbIds: [Int]!) {
      existingShows(tvdbIds: $tvdbIds) {
        id
      }
    }
  `
  client.setHeader('request-id', requestId)
  return client
    .request<{ existingShows: { id: number }[] }>(query, { tvdbIds: [tvdbId] })
    .then(result => result.existingShows[0])
    .then(ids => (ids && ids.id) || null)
    .catch(handleError)
}

export const redKeep = {
  findShowId,
  findUserId,
  scrobbleEpisode
}
