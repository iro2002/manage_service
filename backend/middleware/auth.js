import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_123';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

export function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ msg: 'Access denied. Super Admin privileges required.' });
  }
  next();
}
