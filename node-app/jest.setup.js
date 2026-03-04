// jest.setup.js — runs before any test file in this package
process.env.API_KEY = 'test-key';
process.env.NODE_ID = 'test-node';
process.env.PORT = '4099';
process.env.CMS_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
