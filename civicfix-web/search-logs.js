import fs from 'fs';

const logPath = 'C:\\Users\\Jetira\\.gemini\\antigravity\\brain\\afe9d702-d207-4c28-b8f1-c7e5e18c12ec\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log(`Found ${lines.length} lines in transcript.`);
  for (const line of lines) {
    if (line.includes('testuser_659380')) {
      console.log(line.substring(0, 500));
    }
  }
} catch (e) {
  console.error('Error reading log file:', e.message);
}
