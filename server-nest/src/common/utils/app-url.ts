export function buildAppUrl(clientUrl: string, path: string) {
  const [origin] = clientUrl.split(',');
  return `${origin.trim().replace(/\/$/, '')}${path}`;
}
