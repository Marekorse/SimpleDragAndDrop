import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';


async function getFiles(dir) {
    let files = [];
    const items = await fs.promises.readdir(dir, { withFileTypes: true });

    for (let item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {

            files = [...files, ...await getFiles(fullPath)];
        } else if (item.isFile() && fullPath.endsWith('.ts') && item.name !== 'Interfaces.ts') {

            files.push(fullPath);
        }
    }

    return files;
}


async function build() {
    try {
        const files = await getFiles('src');
        console.log('Files to build:', files);


        await esbuild.build({
            entryPoints: files,
            bundle: true,
            minify: true,
            outdir: 'build',
            format: 'esm',
            platform: 'browser',
            target: ['esnext'],
            loader: { '.ts': 'ts' },
        });

        console.log('Build successful!');
    } catch (error) {
        console.error('Build failed:', error);
    }
}

build();
