const axios = require('axios');

async function testNominatim() {
  try {
    const urls = [
      'https://nominatim.openstreetmap.org/search?city=Chennai&tourism=attraction&format=json&limit=5',
      'https://nominatim.openstreetmap.org/search?city=Chennai&tourism=hotel&format=json&limit=5',
      'https://nominatim.openstreetmap.org/search?city=Chennai&amenity=restaurant&format=json&limit=5'
    ];

    for (const url of urls) {
      console.log('\nQuerying:', url);
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'TravelSphere-AI-App'
        }
      });
      console.log('Response length:', res.data?.length);
      if (res.data?.length > 0) {
        res.data.slice(0, 3).forEach((item, idx) => {
          console.log(`  Item ${idx + 1}:`, item.name || item.display_name, '(', item.lat, ',', item.lon, ')');
        });
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testNominatim();
