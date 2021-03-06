/* eslint-disable no-undef */
const {
  Client,
  requestMethod,
  grantType,
  Request,
} = require('../../lib');

const createServer = require('../util/create-server');
const ClientDataAccessor = require('../util/client-data-accessor');

describe('Generate Token By Client Credentials', () => {
  test('Generate Token Success With Client Authorization', async () => {
    const clientDataAccessor = new ClientDataAccessor();

    const client = await clientDataAccessor.insert(new Client({
      secret: 'SECRET',
      scope: ['accessToken:create', 'test'],
    }));

    const server = createServer(clientDataAccessor);

    const response = await server.token(new Request({
      method: requestMethod.POST,
      headers: {
        Authorization: `Basic ${client.basic()}`,
      },
      body: {
        grant_type: grantType.CLIENT_CREDENTIALS,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(201);
    expect(response.body.access_token).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(response.body.token_type).toEqual('bearer');
    expect(response.body.expires_in).toBeTruthy();
  });

  test('Generate Token Success With Client Secret', async () => {
    const clientDataAccessor = new ClientDataAccessor();

    const client = await clientDataAccessor.insert(new Client({
      secret: 'SECRET',
      scope: ['accessToken:create', 'test'],
    }));

    const server = createServer(clientDataAccessor);

    const response = await server.token(new Request({
      method: requestMethod.POST,
      body: {
        grant_type: grantType.CLIENT_CREDENTIALS,
        scope: ['test'],
        client_id: client.id,
        client_secret: client.secret,
      },
    }));

    expect(response.status).toEqual(201);
    expect(response.body.access_token).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(response.body.token_type).toEqual('bearer');
    expect(response.body.expires_in).toBeTruthy();
  });

  test('Generate Token Fail Because Client Not Authorization', async () => {
    const clientDataAccessor = new ClientDataAccessor();

    const client = await clientDataAccessor.insert(new Client({
      secret: 'SECRET',
      scope: ['accessToken:create', 'test'],
    }));

    const server = createServer(clientDataAccessor);

    const response = await server.token(new Request({
      method: requestMethod.POST,
      body: {
        grant_type: grantType.CLIENT_CREDENTIALS,
        scope: ['test'],
        client_id: client.id,
        client_secret: 'other',
      },
    }));

    expect(response.status).toEqual(401);
    expect(response.body.error).toEqual('unauthorized_client');
  });
});

/* eslint-enable no-undef */
