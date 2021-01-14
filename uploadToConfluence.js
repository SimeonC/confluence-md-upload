const glob = require('glob');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const axios = require('axios').default;
const chalk = require('chalk');
const path = require('path');
const startCase = require('lodash/startCase');
const cliProgress = require('cli-progress');
const markdownTransform = require('./markdownTransform.js');

const progressBar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);

module.exports = async function uploadToConfluence(username, password, baseUrl, fileGlobs, spaceKey) {
  try {
    const confluenceApi = axios.create({
      baseURL: `${baseUrl.replace(/\/$/, '')}/rest/api`,
      auth: {
        username,
        password
      }
    });

    if (!spaceKey) {
      const response = await confluenceApi.get('/space');
      const spaces = response.data.results;
      spaceKey = await new Promise(resolve => {
        inquirer.prompt([
          {
            type: 'list',
            name: 'space',
            message: 'Select confluence space',
            paginated: true,
            choices: spaces.map(space => ({
              name: space.name,
              value: space.key
            }))
          }
        ]).then(({ space }) => {
          resolve(space);
        });
      });
    }

    progressBar.start(1, 0);

    const files = fileGlobs.reduce((files, globPath) => {
      return files.concat(glob.sync(globPath));
    }, []);

    progressBar.start(files.length, 0);

    await Promise.all(files.slice(0, 1).map((filePath) => {
      return fs.readFile(filePath, { encoding: 'utf8' }).then(fileContent => {
        const name = path.basename(filePath, path.extname(filePath));
        return confluenceApi.post('/content', {
          type: 'page',
          title: startCase(name),
          space: {
            key: spaceKey
          },
          body: {
            storage: {
              value: markdownTransform(fileContent),
              representation: 'storage'
            }
          }
        }).then(() => {
          progressBar.increment();
        }).catch(error => {
          console.log(error);
        });
      });
    }));

    progressBar.update(files.length);
    progressBar.stop();
    console.log(chalk.green('All uploaded'));
  } catch (error) {
    console.error(chalk.red(error));
  }
  process.exit(1);
};
