//#!/usr/bin/env node
import * as fs from 'fs';
import { ArgumentParser } from 'argparse';
import * as sourceMap from 'source-map';

async function main()
{
    const parser = new ArgumentParser({
        addHelp: true,
        description: 'Deobfuscate JavaScript code using a source map',
    });

    parser.addArgument(['src-js'], { help: 'Path to javascript file to recover', nargs: 1 });
    parser.addArgument(['src-map'], { help: 'Path to source-map to recover from', nargs: 1 });
    parser.addArgument(['out-dir'], { help: 'Path to directory where sources will be dumped', nargs: 1 });
    const args = parser.parseArgs();

    const code = fs.readFileSync(args['src-js'][0], 'utf8');
    const mapJson = fs.readFileSync(args['src-map'][0], 'utf8');
    const map = <sourceMap.RawSourceMap>JSON.parse(mapJson);
    const mapConsumer = <sourceMap.SourceMapConsumer & sourceMap.RawSourceMap>await new sourceMap.SourceMapConsumer(map);

    const outDir = args['out-dir'][0];
    if (fs.existsSync(outDir))
    {
        throw 'Output directory already exists.';
    }
    fs.mkdirSync(outDir, { recursive: true });

    for (let i = 0; i < mapConsumer.sources.length; i++)
    {
        const sUrl = mapConsumer.sources[i];
        const sPath = sUrl.replace((/^[^/:]+:\/\/\/?/), '').replace((/["<>\|:\*\?\\]/g), '_');

        console.log("Writing", sPath);
        if (sPath.match(/\/$/))
        {
            throw 'assertion error.';
        }

        const sDir = sPath.replace((/^\.\//), '').replace((/^[^\/]+$/), '').replace((/\/[^\/]+$/), '');
        const sFileName = sPath.replace((/.*\//), '');
        if (sFileName.match(/\//))
        {
            throw 'assertion error.';
        }
        const destDir = outDir + '/' + sDir;
        const dest = destDir + '/' + sFileName;

        // console.log({ sUrl, sPath, sDir, sFileName, destDir, dest });

        fs.mkdirSync(destDir, { recursive: true });

        try
        {
            const contents = mapConsumer.sourceContentFor(sUrl);
            fs.writeFileSync(dest, contents, { encoding: 'utf8' });
        }
        catch (error)
        {
            console.error(error);
        }
    }
}

async function run()
{
    try
    {
        await main();
    }
    catch (error)
    {
        console.error(error);
    }
}

run();
