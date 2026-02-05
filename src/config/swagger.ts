// // src/config/swagger.ts
// import swaggerUi from 'swagger-ui-express';
// import YAML from 'yamljs';
// import { Express } from 'express';
// import path from 'path';

// // Load the YAML files
// const userDoc = YAML.load(path.join(__dirname, '../docs/user.yaml'));
// const transactionDoc = YAML.load(path.join(__dirname, '../docs/transaction.yaml'));

// // Merge them
// const swaggerDocument = {
//   openapi: '3.0.0',
//   info: {
//     title: 'Expense Tracker API',
//     version: '1.0.0',
//     description: 'Combined API documentation',
//   },
//   servers: [
//     { url: 'http://localhost:4001/api/v1' }
//   ],

//   paths: {
//     ...userDoc.paths,
//     ...transactionDoc.paths
//   },
//   components: {
//     schemas: {
//       ...userDoc.components.schemas,
//       ...transactionDoc.components.schemas
//     }
//   },
//   tags: [
//     ...(userDoc.tags || []),
//     ...(transactionDoc.tags || [])
//   ]
// };

// export const setupSwagger = (app: Express) => {
//   app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// };

// src/config/swagger.ts
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { Express } from 'express';
import path from 'path';

// Load the YAML files
const userDoc = YAML.load(path.join(__dirname, '../docs/user.yaml'));
const transactionDoc = YAML.load(path.join(__dirname, '../docs/transaction.yaml'));

// Merge them
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Expense Tracker API',
    version: '1.0.0',
    description: 'Combined API documentation',
  },
  servers: [
    { url: 'http://localhost:4001/api/v1' }
  ],
  paths: {
    ...userDoc.paths,
    ...transactionDoc.paths
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ...userDoc.components?.schemas,
      ...transactionDoc.components?.schemas
    }
  },
  tags: [
    ...(userDoc.tags || []),
    ...(transactionDoc.tags || [])
  ]
};

export const setupSwagger = (app: Express) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};