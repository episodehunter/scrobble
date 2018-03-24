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

export interface KodiEvent {
  username: string,
  apikey: string,
  duration: number,
  percent: number,
  timestamp: number,
  eventType: 'stop' | 'scrobble' | 'play',
  mediaType: 'episode' | 'movie'
}

export interface KodiEpisodeEvent extends KodiEvent {
  tvdbId: string,
  title: string,
  year: number,
  season: number,
  episode: number,
  duration: number,
  percent: number,
  timestamp: number,
}

export interface KodiMovieEvent extends KodiEvent {
  originalTitle: string,
  year: number,
  imdbId: string,
}
