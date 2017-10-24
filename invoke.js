const handler = require('./dist/handler');

const data = {
  key: 'value'
};

const event = { body: JSON.stringify(data) };
const callback = (error, result) => console.log(error, result);

handler.plex(event, null, callback);
