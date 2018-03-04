import { MediaProvider } from './types'

export interface EpisodeInformation {
  provider: MediaProvider
  id: number
  season: number
  episode: number
}

export function plexEpisodeParse(payload: string): EpisodeInformation | null {
  const match = /com\.plexapp\.agents\.(.+):\/\/([a-zA-Z0-9]+)\/(\d+)\/(\d+).+/g.exec(
    payload
  )
  if (match) {
    return {
      provider: match[1] as MediaProvider,
      id: (match[2] as any) | 0,
      season: (match[3] as any) | 0,
      episode: (match[4] as any) | 0
    }
  }
  return null
}
