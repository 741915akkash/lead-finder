const fs = require('fs');
const path = require('path');

function renderResume(tailoredResume, outputPath) {
  if (!tailoredResume || typeof tailoredResume !== 'string') {
    throw new Error('Missing tailored resume.');
  }

  if (!outputPath) {
    throw new Error('Missing output path.');
  }

  const absolutePath = path.resolve(outputPath);

  fs.mkdirSync(path.dirname(absolutePath), {
    recursive: true,
  });

  fs.writeFileSync(absolutePath, tailoredResume.trim() + '\n', 'utf8');

  return {
    path: absolutePath,
    content: tailoredResume.trim(),
  };
}

module.exports = {
  renderResume,
};
