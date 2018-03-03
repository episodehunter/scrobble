type PlexPlaybackEvent =
  | 'media.play'
  | 'media.pause'
  | 'media.resume'
  | 'media.stop'
  | 'media.scrobble'
  | 'media.rate'
type PlexMediaType = 'movie' | 'track' | 'episode'
type MediaProvider = 'thetvdb' | 'imdb'

export function plexPlaybackEventParse(
  payload: string
): PlexPlaybackEvent | null {
  const match = /"event": "(.+)",/g.exec(payload)
  if (match) {
    return match[1] as PlexPlaybackEvent
  }
  return null
}

export function plexMediaTypeParse(payload: string): PlexMediaType | null {
  const match = /"type": "(.+)",/g.exec(payload)
  if (match) {
    return match[1] as PlexMediaType
  }
  return null
}

export function plexEpisodeParse(payload: string) {
  const match = /"guid": "com\.plexapp\.agents\.(.+):\/\/([a-zA-Z0-9]+)\/(\d+)\/(\d+).+",/g.exec(
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
