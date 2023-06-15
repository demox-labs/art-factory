import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as path from 'path';

// load variables from .env file into process.env
dotenv.config();
dotenv.config({ path: `./.env.local`, override: true });

// get values from .env
const PRIVATE_KEY_VALUE = process.env.PRIVATE_KEY;
const ADDRESS_VALUE = process.env.ADDRESS;

// check if the variables exist
if (!PRIVATE_KEY_VALUE || !ADDRESS_VALUE) {
  console.error('Missing required environment variables PRIVATE_KEY or ADDRESS');
  process.exit(1);
}

// define paths relative to this script's directory
const programExamplePath = path.join(__dirname, '../program/program.example.json');
const programPath = path.join(__dirname, '../program/program.json');

// read the program.example.json file
fs.readJson(programExamplePath)
  .then(programData => {
    // update the programData
    programData.development = {
      private_key: PRIVATE_KEY_VALUE,
      address: ADDRESS_VALUE
    };

    // write the updated data to a new file
    return fs.writeJson(programPath, programData, { spaces: 2 });
  })
  .then(() => {
    console.log('Successfully created and updated the file');
  })
  .catch(err => {
    console.error('An error occurred:', err);
  });