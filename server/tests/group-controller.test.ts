import { jest } from '@jest/globals';
import { type Request, type Response } from 'express';

const getAllGroupsForApiMock = jest.fn();

await jest.unstable_mockModule('../src/services/group-service.js', () => ({
  getAllGroupsForApi: getAllGroupsForApiMock,
}));

const { listGroups } = await import('../src/controllers/group-controller.js');

function createMockResponse(): Response & {
  statusCode: number;
  body: unknown;
} {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe('listGroups controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns groups from the service', async () => {
    getAllGroupsForApiMock.mockResolvedValue([{ id: 'group-1', name: 'Alpha' }]);
    const res = createMockResponse();

    await listGroups({} as Request, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ groups: [{ id: 'group-1', name: 'Alpha' }] });
  });

  it('maps disconnected database errors to 503', async () => {
    getAllGroupsForApiMock.mockRejectedValue(new Error('Database is not connected'));
    const res = createMockResponse();

    await listGroups({} as Request, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: 'Database is not connected' });
  });
});
