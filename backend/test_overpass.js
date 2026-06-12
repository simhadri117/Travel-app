const axios = require('axios');

async function testOverpass() {
  const lat = 13.0827;
  const lng = 80.2707;
  
  // Overpass queries for attractions, hotels, and restaurants
  const queries = {
    attractions: `[out:json][timeout:10];(node(around:5000,${lat},${lng})[tourism=attraction];node(around:5000,${lat},${lng})[historic];);out body 10;`,
    hotels: `[out:json][timeout:10];(node(around:5000,${lat},${lng})[tourism=hotel];node(around:5000,${lat},${lng})[tourism=hostel];);out body 10;`,
    restaurants: `[out:json][timeout:10];(node(around:5000,${lat},${lng})[amenity=restaurant];node(around:5000,${lat},${lng})[amenity=cafe];);out body 10;`
  };

  for (const [key, q] of Object.entries(queries)) {
    try {
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`;
      console.log(`\nQuerying ${key}:`, url.substring(0, 100) + '...');
      const res = await axios.get(url);
      const elements = res.data?.elements || [];
      console.log(`Response elements count:`, elements.length);
      elements.slice(0, 3).forEach((item, idx) => {
        console.log(`  Item ${idx + 1}:`, item.tags?.name || 'Unnamed', '(', item.lat, ',', item.lon, ')');
      });
    } catch (err) {
      console.error(`Error for ${key}:`, err.message);
    }
  }
}

testOverpass();
