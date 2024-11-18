const fs = require('node:fs');
const path = require('node:path');
const importCollection = require('./import-open-api');
const {envJsonToBru,jsonToBru,jsonToCollectionBru}=require("./util")
const minimist = require('minimist');



const writeFile = async (pathname, content) => {
    try {
      fs.writeFileSync(pathname, content, {
        encoding: 'utf8'
      });
    } catch (err) {
      return Promise.reject(err);
    }
};

const generateUidBasedOnHash = (str) => {
    const hash = simpleHash(str);
  
    return `${hash}`.padEnd(21, '0');
  };

  const stringifyJson = async (str) => {
    try {
      return JSON.stringify(str, null, 2);
    } catch (err) {
      return Promise.reject(err);
    }
  };
  

const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash; // Convert to 32bit integer
    }
    return new Uint32Array([hash])[0].toString(36);
  };


const createDirectory = async (dir) => {
if (!dir) {
    throw new Error(`directory: path is null`);
}

    if (fs.existsSync(dir)) {
        return
    }

    return fs.mkdirSync(dir);
};
      

const sanitizeDirectoryName = (name) => {
    return name.replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-');
};
      


const generateBruFile =  async (collection, collectionLocation) => {
    try {
        let collectionName = sanitizeDirectoryName(collection.name);
        let collectionPath = path.join(collectionLocation, collectionName);

        // if (fs.existsSync(collectionPath)) {
        // throw new Error(`collection: ${collectionPath} already exists`);
        // }

        // Recursive function to parse the collection items and create files/folders
        const parseCollectionItems = (items = [], currentPath) => {
        items.forEach((item) => {
            const rename = item.name.replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-');

            if (['http-request', 'graphql-request'].includes(item.type)) {
                const content = jsonToBru(item);
                const filePath = path.join(currentPath, `${rename}.bru`);
                try {
                fs.writeFile(filePath, content, {}, (err) => {
                    if (err) {
                    console.error(err);
                    }})
                } catch (error) {
                console.error(error);
                }
            }
            if (item.type === 'folder') {
            const folderPath = path.join(currentPath, rename);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }


            if (item?.root?.meta?.name) {
                const folderBruFilePath = path.join(folderPath, 'folder.bru');
                const folderContent = jsonToCollectionBru(
                item.root,
                true // isFolder
                );

                fs.writeFileSync(folderBruFilePath, folderContent);
            }

            if (item.items && item.items.length) {
                parseCollectionItems(item.items, folderPath);
            }
            }
            // Handle items of type 'js'
            if (item.type === 'js') {
            const filePath = path.join(currentPath, `${rename}.js`);
            fs.writeFileSync(filePath, item.fileContent);
            }
        });
        };

        const parseEnvironments = (environments = [], collectionPath) => {
        const envDirPath = path.join(collectionPath, 'environments');
        if (!fs.existsSync(envDirPath)) {
            fs.mkdirSync(envDirPath);
        }

        environments.forEach((env) => {
            const content = envJsonToBru(env);
            const filePath = path.join(envDirPath, `${env.name}.bru`);
            fs.writeFileSync(filePath, content);
        });
        };

        const getBrunoJsonConfig = (collection) => {
        let brunoConfig = collection.brunoConfig;

        if (!brunoConfig) {
            brunoConfig = {
            version: '1',
            name: collection.name,
            type: 'collection',
            ignore: ['node_modules', '.git']
            };
        }

        return brunoConfig;
        };


        await createDirectory(collectionPath);

        const uid = generateUidBasedOnHash(collectionPath);
        const brunoConfig = getBrunoJsonConfig(collection);
        const stringifiedBrunoConfig = await stringifyJson(brunoConfig);

        // Write the Bruno configuration to a file
        await writeFile(path.join(collectionPath, 'bruno.json'), stringifiedBrunoConfig);

        const collectionContent = jsonToCollectionBru(collection.root);
        await writeFile(path.join(collectionPath, 'collection.bru'), collectionContent);

        // mainWindow.webContents.send('main:collection-opened', collectionPath, uid, brunoConfig);
        // ipcMain.emit('main:collection-opened', mainWindow, collectionPath, uid, brunoConfig);

        // lastOpenedCollections.add(collectionPath);

        // create folder and files based on collection
        await parseEnvironments(collection.environments, collectionPath);
        await parseCollectionItems(collection.items, collectionPath);
    } catch (error) {
        return Promise.reject(error);
}
};

const run = (args) => {
    const argv = minimist(args, {
        string: ['version', 'input', 'config'],
        alias: { v: 'version', i: 'input', c: 'config', o: 'outputdir' },
      });
    const configs = require(path.join(process.cwd(), argv.input))

    configs.map((config) => {
        importCollection(config.input).then(({ collection }) => {
            generateBruFile(collection, config.output);
        })
    })
}

module.exports = { run };