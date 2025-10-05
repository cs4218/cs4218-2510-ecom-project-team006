const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');
jest.mock('../models/userModel.js', () => ({ findById: jest.fn() }));
const userModel = require('../models/userModel.js');

const { requireSignIn, isAdmin } = require('./authMiddleware');

describe('authMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    // silence console
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore && console.error.mockRestore();
  });

  describe('requireSignIn', () => {
    it('calls next and attaches req.user when token is valid', async () => {
      req.headers.authorization = 'valid-token';
      jwt.verify.mockReturnValue({ _id: 'u1', name: 'Alice' });

      await requireSignIn(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(req.user).toEqual({ _id: 'u1', name: 'Alice' });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid', async () => {
      req.headers.authorization = 'bad-token';
      jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

      await requireSignIn(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('bad-token', process.env.JWT_SECRET);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('calls next when user has role 1', async () => {
      req.user = { _id: 'u1' };
      userModel.findById.mockResolvedValue({ role: 1 });

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith('u1');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when user role is not 1', async () => {
      req.user = { _id: 'u2' };
      userModel.findById.mockResolvedValue({ role: 0 });

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith('u2');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'UnAuthorized Access' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 500 when findById throws', async () => {
      req.user = { _id: 'u3' };
      userModel.findById.mockImplementation(() => { throw new Error('db error'); });

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith('u3');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
