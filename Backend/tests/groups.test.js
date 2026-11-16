const request = require('supertest');
const app = require('../app');

let token;
let user;
let groupId;

async function register(name, email, password) {
  const res = await request(app).post('/api/auth/register').send({
    name, email, password,
  });
  return { token: res.body.data.token, user: res.body.data.user };
}

describe('Groups', () => {
  beforeEach(async () => {
    ({ token, user } = await register('Owner', 'owner@example.com', 'password123'));
  });

  it('creates a group with the caller as the first member', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Trip to Goa', description: 'Summer vacation' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Trip to Goa');
    expect(res.body.data.members).toHaveLength(1);
    expect(res.body.data.members[0]._id).toBe(user.id);
    groupId = res.body.data._id;
  });

  it('lists groups the user belongs to', async () => {
    await request(app).post('/api/groups').set('Authorization', `Bearer ${token}`).send({ name: 'Group A' });
    await request(app).post('/api/groups').set('Authorization', `Bearer ${token}`).send({ name: 'Group B' });

    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.status).toBe(401);
  });

  it('returns 404 for an unknown group', async () => {
    const res = await request(app)
      .get('/api/groups/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});