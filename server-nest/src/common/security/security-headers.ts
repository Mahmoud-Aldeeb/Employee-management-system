import type { RequestHandler } from 'express';
import * as helmetNamespace from 'helmet';
import type { HelmetOptions } from 'helmet';
import { DOCS_PATH, SWAGGER_CDN_ORIGIN } from '../../docs/docs.constants.js';

type HelmetFn = (options?: HelmetOptions) => RequestHandler;

const helmet = ((helmetNamespace as unknown as { default?: HelmetFn })
  .default ?? helmetNamespace) as unknown as HelmetFn;

export function createSecurityHeaders(): RequestHandler {
  const defaults = helmet();
  const docs = helmet({
    contentSecurityPolicy: {
      directives: { 'script-src': ["'self'", SWAGGER_CDN_ORIGIN] },
    },
  });

  return (request, response, next) => {
    const handler = request.path.startsWith(DOCS_PATH) ? docs : defaults;
    handler(request, response, next);
  };
}
