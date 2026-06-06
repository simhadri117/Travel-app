const http = require('http');

const body = JSON.stringify({
  source: 'Delhi',
  destination: 'chennai',
  startDate: '2026-06-13',
  endDate: '2026-06-17',
  budget: 20000,
  travelType: 'Friends',
  travelers: 2
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/v1/itinerary/generate-realtime',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

let buffer = '';
const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', (chunk) => {
    buffer += chunk.toString();
    // Print each SSE event as it arrives
    const lines = buffer.split('\n\n');
    buffer = lines.pop(); // keep incomplete
    for (const line of lines) {
      const data = line.replace(/^data: /, '').trim();
      if (!data) continue;
      try {
        const json = JSON.parse(data);
        if (json.step === 'error') {
          console.log('ERROR:', json.message);
        } else if (json.step === 'done') {
          const days = json.itinerary?.days || [];
          console.log('SUCCESS! Days generated:', days.length);
          if (days[0]) {
            const d = days[0];
            console.log('Day 1 Morning:', d.morning?.activity_name);
            console.log('Day 1 Afternoon:', d.afternoon?.activity_name);
            console.log('Day 1 Evening:', d.evening?.activity_name);
            console.log('Day 1 Night:', d.night?.activity_name);
            console.log('Day 1 Lunch:', d.lunch?.restaurant_name);
            console.log('Day 1 Dinner:', d.dinner?.restaurant_name);
            console.log('Travel Morning→Afternoon:', JSON.stringify(d.travel_morning_to_afternoon));
          }
        } else {
          console.log('STEP:', json.step, '|', json.message, '| Progress:', json.progress + '%');
        }
      } catch(e) {
        // skip
      }
    }
  });
  res.on('end', () => {
    console.log('--- Request complete ---');
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.setTimeout(90000, () => {
  console.log('Request timed out after 90s');
  req.destroy();
  process.exit(1);
});

req.write(body);
req.end();
