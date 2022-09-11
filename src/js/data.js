export async function getGeoJson(url) {
  let response = await fetch(url)

  response = await response.json()
  return response
}
