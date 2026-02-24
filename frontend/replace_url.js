import fs from 'fs';
import path from 'path';

const files = [
    'src/context/SocketContext.tsx',
    'src/components/VideoUpload.tsx',
    'src/pages/ContentDetail.tsx',
    'src/pages/Discover.tsx',
    'src/pages/ContentForm.tsx',
    'src/pages/MyLuma.tsx',
    'src/pages/Profile.tsx',
    'src/pages/AdminContent.tsx',
    'src/pages/ConversationDetail.tsx',
    'src/pages/AdminDashboard.tsx'
];

for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Calculate relative path for api import
    const depth = file.split('/').length - 2;
    const prefix = depth === 0 ? './' : '../'.repeat(depth);
    const apiImportPath = `${prefix}services/api`;
    
    // Add import if not exists
    if (!content.includes('SERVER_URL')) {
        const importStmt = `import { SERVER_URL } from '${apiImportPath}';\n`;
        // Insert after first import or at top
        const firstImportEnd = content.indexOf('\n', content.lastIndexOf('import '));
        if (firstImportEnd !== -1) {
            content = content.slice(0, firstImportEnd + 1) + importStmt + content.slice(firstImportEnd + 1);
        } else {
            content = importStmt + content;
        }
    }
    
    // Replace hardcoded URLs
    content = content.replace(/http:\/\/localhost:3000/g, '${SERVER_URL}');
    // Because we used template literals blindly, some places might already be in backticks, some in single quotes
    // This is dangerous. Let's fix up specific patterns:
    
    content = content.replace(/'\$\{SERVER_URL\}/g, '`${SERVER_URL}');
    content = content.replace(/\$\{SERVER_URL\}'/g, '${SERVER_URL}`');
    content = content.replace(/"\$\{SERVER_URL\}/g, '`${SERVER_URL}');
    content = content.replace(/\$\{SERVER_URL\}"/g, '${SERVER_URL}`');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
}
