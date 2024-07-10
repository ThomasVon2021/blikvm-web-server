import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';

const directory = 'build';

const renameFiles = (dir) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      renameFiles(filePath);
    }
  });
};

renameFiles(directory);

// 将'dist'目录复制到'build/src/ui/dist'
fsExtra.copySync('dist', 'build/src/server/dist');
