import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Prisma from '../db/db.js';

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 👇 Register Route (Default role = ADMIN)
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await Prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👇 Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user);

    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    res.json({ success: true, token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👇 Get Logged-in User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await Prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👇 Update Profile (Name)
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const updatedUser = await Prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👇 Change Password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await Prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ error: 'Old password is incorrect' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await Prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👇 One-time Create SUPER_ADMIN
export const createSuperAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingSuperAdmin = await Prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (existingSuperAdmin) {
      return res.status(400).json({ error: 'Super Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = generateToken(user);

    res.json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
