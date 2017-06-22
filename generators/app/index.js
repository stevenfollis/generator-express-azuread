'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(
      `Welcome to the cloud-tastic ${chalk.blue('express-azuread')} generator!`
    ));

    const prompts = [{
      type: 'input',
      name: 'name',
      message: `What is your application's name?`
    },
    {
      type: 'list',
      choices: ['Version 1 Endpoint (created at http://portal.azure.com)', 'Version 2 Endpoint (created at http://apps.dev.microsoft.com)'],
      name: 'aadVersion',
      message: `Will your application use Azure Active Directory's version 1 or version 2 endpoints?`,
      default: 'Version 2 Endpoint (created at http://apps.dev.microsoft.com)'
    },
    {
      type: 'input',
      name: 'aadClientId',
      message: `Please enter your AzureAD application's Client ID`
    },
    {
      type: 'input',
      name: 'aadClientSecret',
      message: `Please enter your AzureAD application's Client Secret`
    },
    {
      type: 'input',
      name: 'aadTenantId',
      message: `Please enter your specific AzureAD tenant ID, or use common`,
      default: 'common'
    },
    {
      type: 'input',
      name: 'aadRedirectUrl',
      message: `Please enter the redirectUrl registered for your application`,
      default: 'http://localhost:3000/auth/openid/return'
    }];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  writing() {
    // Copy files from the template folder to the destination
    // Also passes in the props object for templating replacements
    this.fs.copyTpl(
      this.templatePath('**/**'),
      this.destinationPath(),
      this.props,
      null,
      {globOptions: {dot: true}}
    );
  }

  install() {
    this.npmInstall();
  }
};
