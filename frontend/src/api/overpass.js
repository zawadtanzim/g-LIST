const overpassQuery = `
  [out:json][timeout:25];
  (
    node["shop"="supermarket"](around:1000, [LATITUDE], [LONGITUDE]);
    way["shop"="supermarket"](around:1000, [LATITUDE], [LONGITUDE]);
    relation["shop"="supermarket"](around:1000, [LATITUDE], [LONGITUDE]);
  );
  out body;
  >;
  out skel qt;
`;

export async function fetchNearbyStores(lat, lon) {
  const query = overpassQuery.replace('[LATITUDE]', lat).replace('[LONGITUDE]', lon);
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
  });
  const data = await response.json();
  return data.elements; // Array of nearby supermarkets
}