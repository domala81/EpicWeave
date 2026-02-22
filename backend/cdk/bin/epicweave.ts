#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EpicWeaveStack } from '../lib/epicweave-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new EpicWeaveStack(app, 'EpicWeaveStack-dev', {
  env,
  stackName: 'EpicWeaveStack-dev',
  description: 'EpicWeave E-Commerce Platform - Development',
  tags: {
    Environment: 'dev',
    Project: 'EpicWeave',
    ManagedBy: 'CDK',
  },
});

app.synth();
