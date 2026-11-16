const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('POST /api/auth/register', () => {
  it('creates a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.token).toBeTruthy();
    expect(await User.findOne({ email: 'alice@example.com' })).toBeTruthy();
  });

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'dup@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice 2',
      email: 'dup@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  it('rejects a short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Carol',
      email: 'carol@example.com',
      password: 'password123',
    });
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'carol@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'carol@example.com',
      password: 'wrongpass',
    });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});