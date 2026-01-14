
import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
const content = fs.readFileSync(schemaPath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('enum CommunicationChannel') || lines[i].includes('enum CommunicationType')) {
        console.log(`Found enum on line ${i + 1}: ${lines[i]}`);
        // Print next 10 lines
        for (let j = 1; j <= 10; j++) {
            if (lines[i + j]) console.log(`  ${lines[i + j]}`);
        }
    }
}
