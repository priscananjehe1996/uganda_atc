/**
 * Vanilla JavaScript utility functions for traffic calculations.
 * Included to provide lightweight calculations without TypeScript overhead.
 */

export function calculateCongestionIndex(volume, capacity) {
  if (capacity <= 0) return 0;
  const vcr = volume / capacity;
  
  if (vcr < 0.5) return 'Level A (Free Flow)';
  if (vcr < 0.7) return 'Level B (Stable Flow)';
  if (vcr < 0.85) return 'Level C (Approaching Unstable)';
  if (vcr < 1.0) return 'Level D (Unstable Flow)';
  return 'Level F (Gridlock)';
}

export function formatLargeNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function parseTrafficCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const obj = {};
    const currentline = lines[i].split(',');
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j].trim()] = currentline[j] ? currentline[j].trim() : '';
    }
    result.push(obj);
  }
  return result;
}
