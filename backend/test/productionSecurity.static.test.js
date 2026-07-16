const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');

const javascriptFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolutePath = path.join(directory, entry.name);
  if (entry.isDirectory()) return javascriptFiles(absolutePath);
  return entry.isFile() && entry.name.endsWith('.js') ? [absolutePath] : [];
});

test('não reintroduz sync alter nem detalhes internos nas respostas', () => {
  const files = [path.join(backendRoot, 'app.js'), ...javascriptFiles(path.join(backendRoot, 'src'))];
  const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

  assert.doesNotMatch(source, /\.sync\(\s*\{\s*alter\s*:/);
  assert.doesNotMatch(source, /\bdetails\s*:\s*(?:error|erro)\.message/);
});
