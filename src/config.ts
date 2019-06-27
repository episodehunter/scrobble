export const config = {
  sentryDsn: process.env.AWS_SENTRY_DSN,
  logdnaKey: process.env.LOGDNA_KEY,
  redKeepApiKey: process.env.EH_RED_KEEP_API_KEY || '',
  ehRedKeepUrl: process.env.EH_RED_KEEP_URL || '',
  addShowFunctionName: process.env.ADD_SHOW_FUNCTION || '',
  addShowDragonstoneFunctionName: process.env.ADD_SHOW_DRAGONSTONE_FUNCTION || '',
}
