module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['step-definitions/**/*.ts', 'support/**/*.ts'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true
  }
};
