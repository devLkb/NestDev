export function getChromeApi() {
  return globalThis.chrome
}

export function hasChromeNamespace(name) {
  return Boolean(getChromeApi()?.[name])
}

export function chromeRuntimeUrl(path) {
  const chromeApi = getChromeApi()
  if (chromeApi?.runtime?.getURL) return chromeApi.runtime.getURL(path)
  return path
}
