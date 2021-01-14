#!/usr/bin/env node
const chalk = require('chalk');
const program = require('commander');
const inquirer = require('inquirer');
const pkg = require('./package.json');
const uploadToConfluence = require('./uploadToConfluence');

program
  .version(pkg.version)
  .arguments('<fileGlobs...>')
  .usage('[options] <fileGlobs ...>')
  .option('-u, --username [value]', 'Jira Username')
  .option('-p, --password [value]', 'Jira Password or API Token')
  .option('-b, --baseUrl [value]', 'Url of the confluence wiki e.g. https://your-domain.atlassian.net/wiki/')
  .option('-s, --space [value]', 'Confluence space key')
  .action((fileGlobs) => {
    if (fileGlobs.length === 0) {
      console.log(chalk.red('No file globs passed.'));
      return;
    }
    const { username, password, baseUrl, space } = program;
    if (!username || !password || !baseUrl) {
      return inquirer.prompt([
        {
          type: 'input',
          name: 'username',
          message: 'Enter Confluence API Username',
          default: () => username
        },
        {
          type: 'input',
          name: 'password',
          message: 'Enter Confluence API Password',
          default: () => password
        },
        {
          type: 'input',
          name: 'baseUrl',
          message: 'Enter Confluence API baseUrl',
          default: () => baseUrl
        }
      ]).then(({ username, password, baseUrl }) => {
        uploadToConfluence(username, password, baseUrl, fileGlobs, space);
      });
    }

    uploadToConfluence(username, password, baseUrl, fileGlobs, space);
  })
  .parse(process.argv);

