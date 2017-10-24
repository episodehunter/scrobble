import { connect, Connection, entities } from '@episodehunter/datastore';
import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import * as assertRequiredConfig from 'assert-env';

assertRequiredConfig([
  'EH_DB_HOST',
  'EH_DB_PORT',
  'EH_DB_USERNAME',
  'EH_DB_PASSWORD',
  'EH_DB_DATABASE',
  'EH_RAVEN_DSN',
  'EH_RAVEN_PROJECT'
]);

export async function plex(event: APIGatewayEvent, context: Context, callback: Callback) {
  const message = event.body;

  console.log(`Will do something with ${message}`);

  callback(undefined, true);
}
