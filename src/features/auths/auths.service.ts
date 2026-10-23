import { AppError } from '../../errors/app.error';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../config/prisma-cllient.config';
import { RegisterUserInput } from '../../validators/auths.validator';
import type {
  LoginUserInput,
  SetPasswordUserInput,
} from '../../validators/auths.validator';
import { Bcrypt } from '../../lib/bcrypt.lib';
import { Jwt } from '../../lib/jwt.lib';

export class AuthsService {
  static async registerForCustomer({ body }: RegisterUserInput) {
    const findUsersByEmail = await prisma.users.findUnique({
      where: {
        email: body.email,
      },
    });

    if (findUsersByEmail) throw new AppError(409, 'Email already exists');

    const passwordHashed = await Bcrypt.hashPassword(body.password);

    let referralCode = '';

    do {
      referralCode = `JOVLEN-${randomBytes(4).toString('hex').toUpperCase()}`;
    } while (
      await prisma.users.findUnique({
        where: { referralCode },
        select: { id: true },
      })
    );

    const users = await prisma.users.create({
      data: {
        ...body,
        role: 'CUSTOMER',
        passwordHash: passwordHashed,
        referralCode,
      },
    });

    const { id, passwordHash, ...userWithoutPassword } = users;

    return userWithoutPassword;
  }

  static async registerForEo({ body }: RegisterUserInput) {
    const findUsersByEmail = await prisma.users.findUnique({
      where: {
        email: body?.email,
      },
    });

    if (findUsersByEmail) throw new AppError(409, 'Email already exists');

    const passwordHashed = await Bcrypt.hashPassword(body?.password);

    let referralCode = '';

    do {
      referralCode = `JOVLEN-${randomBytes(4).toString('hex').toUpperCase()}`;
    } while (
      await prisma.users.findUnique({
        where: { referralCode },
        select: { id: true },
      })
    );

    const users = await prisma.users.create({
      data: {
        ...body,
        role: 'EO',
        passwordHash: passwordHashed,
        referralCode,
      },
    });

    const { passwordHash, ...userWithoutPassword } = users;

    return userWithoutPassword;
  }

  static async login({ body }: LoginUserInput) {
    const findUserByEmail = await prisma.users.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!findUserByEmail) {
      throw new AppError(404, 'Email or password is incorrect');
    }

    const isComparePassword = await Bcrypt.comparePassword(
      body.password,
      findUserByEmail.passwordHash,
    );

    if (!isComparePassword) {
      throw new AppError(404, 'Email or password is incorrect');
    }

    const token = await Jwt.generate(
      {
        id: findUserByEmail.id,
        role: findUserByEmail.role,
      },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: '1h' },
    );

    const { passwordHash, ...userWithoutPassword } = findUserByEmail;

    return {
      token,
      userWithoutPassword,
    };
  }

  static async me(id: string) {
    return await prisma.users.findUnique({
      where: {
        id,
      },
      select: {
        email: true,
        role: true,
      },
    });
  }

  static async setPassword({ body, params }: SetPasswordUserInput) {
    const findUser = await prisma.users.findUnique({
      where: {
        id: params?.userId,
      },
    });

    if (!findUser) throw new AppError(404, 'User not found');

    const passwordHashed = await Bcrypt.hashPassword(body?.password);

    const user = await prisma.users.update({
      data: {
        passwordHash: passwordHashed,
      },
      where: {
        id: params?.userId,
      },
    });

    const { passwordHash, ...safeUser } = user;

    return { safeUser };
  }
}
