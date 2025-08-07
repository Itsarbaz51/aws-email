import jwt from 'jsonwebtoken';
import Prisma from '../db/db.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient role.' });
    }
    next();
  };
};

export const requireSubscription = (minTier) => {
  return async (req, res, next) => {
    const user = await Prisma.user.findUnique({
      where: { id: req.user.id },
      select: { subscriptionTier: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tiers = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    const userTierIndex = tiers.indexOf(user.subscriptionTier);
    const minTierIndex = tiers.indexOf(minTier);

    if (userTierIndex < minTierIndex) {
      return res.status(403).json({ error: `Requires at least ${minTier} subscription` });
    }

    next();
  };
};

export const checkDomainAccess = async (req, res, next) => {
  const domainId = req.params.domainId;

  const domain = await Prisma.domain.findUnique({
    where: { id: domainId },
    select: { userId: true }
  });

  if (!domain) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  if (domain.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied to this domain' });
  }

  next();
};

export const checkMailboxAccess = async (req, res, next) => {
  const mailboxId = req.params.mailboxId;

  const mailbox = await Prisma.mailbox.findUnique({
    where: { id: mailboxId },
    select: { userId: true }
  });

  if (!mailbox) {
    return res.status(404).json({ error: 'Mailbox not found' });
  }

  if (mailbox.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied to this mailbox' });
  }

  next();
};
