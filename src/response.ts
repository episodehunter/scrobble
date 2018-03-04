export const createOkResponse = message => ({
  statusCode: '200',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message })
})

export const createUnauthorizedOkResponse = message => ({
  statusCode: '401',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message })
})
