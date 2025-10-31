#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CatalogApiStack } from './stacks/catalog-api-stack';
import {getConfig} from "./lib/config";

const config = getConfig();

const app = new cdk.App();

new CatalogApiStack(app, 'CatalogApiStack', {
  env: {
    region: config.AWS_REGION || 'us-east-1',
  },
    config
});
