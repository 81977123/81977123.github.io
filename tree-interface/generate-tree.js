import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从父目录的docs目录开始构建树
const docsPath = path.join(__dirname, '..', 'docs');

function buildTree(dirPath, relativePath = '') {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const node = {
    name: path.basename(dirPath),
    path: relativePath || '/',
    type: 'directory',
    children: []
  };

  for (const item of items) {
    const itemRelativePath = path.join(relativePath, item.name);
    if (item.isDirectory()) {
      const childDirPath = path.join(dirPath, item.name);
      node.children.push(buildTree(childDirPath, itemRelativePath));
    } else {
      // 只包含Markdown文件
      if (item.name.endsWith('.md')) {
        node.children.push({
          name: item.name,
          path: itemRelativePath,
          type: 'file',
          ext: path.extname(item.name)
        });
      }
    }
  }

  // 按类型排序：目录在前，文件在后，按字母顺序
  node.children.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'directory' ? -1 : 1;
  });

  return node;
}

const tree = buildTree(docsPath);
const output = {
  generated: new Date().toISOString(),
  root: tree
};

fs.writeFileSync(
  path.join(__dirname, 'tree-data.json'),
  JSON.stringify(output, null, 2)
);

console.log('树状数据已生成到 tree-interface/tree-data.json');