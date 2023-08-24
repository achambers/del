#!/usr/bin/env node

const path = require('path');
const pkg = require(path.join(__dirname, 'package.json'));
const { Command } = require('commander');
const figlet = require('figlet');
const chalk = require('chalk');
const fs = require('fs');
const util = require('util');

const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

const UNSEEN_PATH = path.join(__dirname, 'unseen.json');
const COMPONENTS_PATH = path.join(process.cwd(), 'app', 'components');
const TESTS_PATH = path.join(process.cwd(), 'tests');
const UNIT_TESTS_PATH = path.join(TESTS_PATH, 'unit', 'components');
const COMPONENT_TESTS_PATH = path.join(TESTS_PATH, 'integration', 'components');

console.log(chalk.blueBright(figlet.textSync(pkg.name)));

const program = new Command();

program
  .name(pkg.name)
  .version(pkg.version)
  .description(pkg.description)
  .option('-d, --delete-found-components', 'Deletes components found in project')
  .option('-f, --found', 'Show found components')
  .option('-nf, --not-found', 'Show not found components')
  .action(async (options, command) => {
    if (await exists(UNSEEN_PATH)) {
      let unseen = JSON.parse(await readFile(UNSEEN_PATH));

      unseen = unseen
        .map(i => i.replace('component:', ''))
        .filter(i => !i.startsWith('@'));

      let found = [];
      let notFound = [];

      for(const i of unseen) {
        if (await exists(`${path.join(COMPONENTS_PATH, i)}.js`)) {
          found.push(i);
        } else if (await exists(`${path.join(COMPONENTS_PATH, i)}.ts`)) {
          found.push(i);
        } else if (await exists(`${path.join(COMPONENTS_PATH, i)}.hbs`)) {
          found.push(i);
        } else {
          notFound.push(i);
        }
      }

      if (Object.keys(options).length === 0) {
        options.found = true;
        options.notFound = true;
      }

      if (options.deleteFoundComponents) {
        let deletedJs = 0;
        let deletedTs = 0;
        let deletedHbs = 0;
        let deletedTests = 0;

        for(const i of found) {
          let paths = [
            `${path.join(COMPONENTS_PATH, i)}.js`,
            `${path.join(COMPONENTS_PATH, i)}.ts`,
            `${path.join(COMPONENTS_PATH, i)}.hbs`,
            `${path.join(UNIT_TESTS_PATH, i)}-test.js`,
            `${path.join(UNIT_TESTS_PATH, i)}-test.ts`,
            `${path.join(COMPONENT_TESTS_PATH, i)}-test.js`,
            `${path.join(COMPONENT_TESTS_PATH, i)}-test.ts`,
          ];

          for (const j of paths) {
            try {
              if (await exists(j)) {
                await unlink(j);

                if (j.endsWith('-test.js')) {
                  deletedTests++;
                } else if (j.endsWith('-test.ts')) {
                  deletedTests++;
                } else if (j.endsWith('.js')) {
                  deletedJs++;
                } else if (j.endsWith('.ts')) {
                  deletedTs++;
                } else if (j.endsWith('.hbs')) {
                  deletedHbs++;
                }
              }
            } catch (e) {
              console.log(chalk.redBright(`Error deleting component ${i}`));

              throw e;
            }
          }
        }

        console.log(chalk.greenBright(`Unseen ${unseen.length} components`));
        console.log(chalk.greenBright(`Found ${found.length} components`));
        console.log(chalk.greenBright(`Deleted ${deletedJs} js components`));
        console.log(chalk.greenBright(`Deleted ${deletedTs} ts components`));
        console.log(chalk.greenBright(`Deleted ${deletedHbs} hbs components`));
        console.log(chalk.greenBright(`Deleted ${deletedTests} tests`));
      }

      if (options.found) {
        console.log(chalk.greenBright('Found components:'));
        console.log(chalk.greenBright(found.join('\n')));
      }

      if (options.notFound) {
        console.log(chalk.redBright('Not found components:'));
        console.log(chalk.redBright(notFound.join('\n')));
      }
    }
  });

program.parseAsync(process.argv);
