const exec = require('child_process').exec;

/* eslint-disable no-console */

exec('cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js',
  (error, stdout, stderr) => {
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    if (error !== null) {
      console.log(`exec error: ${error}`);
    }
  });
