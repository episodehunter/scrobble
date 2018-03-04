export type PlexPlaybackEvent =
  | 'media.play'
  | 'media.pause'
  | 'media.resume'
  | 'media.stop'
  | 'media.scrobble'
  | 'media.rate'
export type PlexMediaType = 'movie' | 'track' | 'episode'
export type MediaProvider = 'thetvdb' | 'imdb'

export interface PlexEvent {
  event: PlexPlaybackEvent
  Metadata: {
    guid: string
    type: PlexMediaType
  }
}
