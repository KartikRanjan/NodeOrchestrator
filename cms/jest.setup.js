// jest.setup.js — runs before any test file in this package
// Sets required environment variables before any src/ module is imported.
process.env.API_KEY = 'test-key';
process.env.NODE_ENV = 'test';
process.env.PORT = '3099';
