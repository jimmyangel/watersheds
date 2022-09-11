export async function getGeoJson(url) {
  console.log('test')
  let response = await fetch(url)

  response = await response.json()
  return response
}
