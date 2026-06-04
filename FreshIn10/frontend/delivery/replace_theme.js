const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

try {
  const files = execSync('"C:\\Users\\SK Studio\\AppData\\Local\\GitHubDesktop\\app-3.5.8\\resources\\app\\git\\cmd\\git.exe" grep -l -E "#0f172a|#0d1f0e|bg-slate-900|text-white|bg-gray-900" src/app', { encoding: 'utf-8' }).trim().split('\n');

  for (const file of files) {
    if (!file) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Gradients
    content = content.replace(/linear-gradient\(135deg, #0f172a 0%, #0d1f0e 50%, #0f172a 100%\)/g, '#f9fafb');
    content = content.replace(/linear-gradient\(135deg, #0f172a 0%, #0d1f0e 55%, #0f172a 100%\)/g, '#f9fafb');
    content = content.replace(/linear-gradient\(135deg, #0f172a, #0d2818\)/g, '#ffffff');
    
    // Specific elements
    content = content.replace(/bg-gray-900 text-white/g, 'bg-green-600 text-white');
    content = content.replace(/text-white/g, 'text-gray-900');
    content = content.replace(/bg-gray-900/g, 'bg-white');
    content = content.replace(/bg-slate-900/g, 'bg-white');
    content = content.replace(/border-slate-800/g, 'border-gray-200');
    content = content.replace(/border-slate-700/g, 'border-gray-200');
    content = content.replace(/text-slate-400/g, 'text-gray-500');
    content = content.replace(/text-slate-300/g, 'text-gray-600');
    content = content.replace(/glass-dark/g, 'bg-white border border-gray-100 shadow-sm');
    content = content.replace(/card-neon/g, 'bg-white border border-gray-100 shadow-sm');
    
    // Restore button text whites that got clobbered if they were green or red etc
    content = content.replace(/bg-green-600 text-gray-900/g, 'bg-green-600 text-white');
    content = content.replace(/bg-red-600 text-gray-900/g, 'bg-red-600 text-white');
    content = content.replace(/bg-blue-600 text-gray-900/g, 'bg-blue-600 text-white');
    
    fs.writeFileSync(file, content);
  }
  console.log('done');
} catch(e) {
  console.error(e.message);
}
