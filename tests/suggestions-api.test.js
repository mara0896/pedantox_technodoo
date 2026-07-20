const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

function waitForServer(url, timeoutMs = 5000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tryRequest = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - startedAt > timeoutMs) {
            reject(new Error('Server did not start in time'));
          } else {
            setTimeout(tryRequest, 100);
          }
        });
    };
    tryRequest();
  });
}

test('the suggestions API reads and writes a shared JSON file', async () => {
  const repoRoot = path.join(__dirname, '..');
  const suggestionsPath = path.join(repoRoot, 'data', 'suggestions.json');
  const originalContent = fs.readFileSync(suggestionsPath, 'utf8');

  const server = spawn(process.execPath, ['server.js'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await waitForServer('http://127.0.0.1:3000/api/suggestions');

    const initialResponse = await fetch('http://127.0.0.1:3000/api/suggestions');
    const initialData = await initialResponse.json();
    assert.ok(Array.isArray(initialData));

    const postResponse = await fetch('http://127.0.0.1:3000/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestions: ['Titre partagé de test'] })
    });

    assert.equal(postResponse.status, 200);

    const updatedResponse = await fetch('http://127.0.0.1:3000/api/suggestions');
    const updatedData = await updatedResponse.json();
    assert.ok(updatedData.includes('Titre partagé de test'));
  } finally {
    server.kill('SIGTERM');
    fs.writeFileSync(suggestionsPath, originalContent);
  }
});
