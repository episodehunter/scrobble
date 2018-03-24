import { isKodiEpisode, parseJson } from '../parse.util'

test('Is an kodi episode', () => {
  // Arrange
  const event = {
    mediaType: 'episode'
  }

  // Act
  const result = isKodiEpisode(event as any)

  // Assert
  expect(result).toBe(true)
})

test('Is not an kodi episode', () => {
  // Arrange
  const event = {
    mediaType: 'movie'
  }

  // Act
  const result = isKodiEpisode(event as any)

  // Assert
  expect(result).toBe(false)
})

test('Is not an kodi episode when media type is missing', () => {
  // Arrange
  const event = {}

  // Act
  const result = isKodiEpisode(event as any)

  // Assert
  expect(result).toBe(false)
})

test('Parse json', () => {
  // Arrange
  const jsonStr = '{ "key": "value" }'

  // Act
  const result = parseJson(jsonStr)

  // Assert
  expect(result).toEqual({ key: 'value' })
})

test('Return null when unable to parse json', () => {
  // Arrange
  const badJsonStr = '{ key: "value" }'

  // Act
  const result = parseJson(badJsonStr)

  // Assert
  expect(result).toBe(null)
})
