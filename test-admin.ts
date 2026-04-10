import http from 'http';
http.get('http://localhost:3000/admin', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(res.statusCode, data.substring(0, 100)));
}).on('error', (err) => console.error(err.message));
