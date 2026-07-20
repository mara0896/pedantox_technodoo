const http = require('http');
const fs = require('fs');
const path = require('path');

const repoRoot = __dirname;
const suggestionsPath = path.join(repoRoot, 'data', 'suggestions.json');

function readSuggestions() {
  try {
    const raw = fs.readFileSync(suggestionsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeSuggestions(suggestions) {
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/suggestions' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readSuggestions()));
    return;
  }

  if (req.url === '/api/suggestions' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
        writeSuggestions(suggestions);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(readSuggestions()));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Suggestions server listening on http://127.0.0.1:3000');
});
