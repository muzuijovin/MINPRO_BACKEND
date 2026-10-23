import { randomBytes } from 'node:crypto';
import { prisma } from '../../config/prisma-cllient.config';
import { AppError } from '../../errors/app.error';
import { RegisterUserInput } from '../../validators/users.validators';
import type { SignOptions } from 'jsonwebtoken';
import type { LoginUserInput } from '../../validators/users.validators';
import { Jwt } from '../../lib/jwt.lib';
import { Bcrypt } from '../../lib/bcrypt.lib';

export class AuthServices {
  static async register({ body }: { body: RegisterUserInput }) {
    // 1. Check whether the username already exists
    const findUserByUsername = await prisma.users.findUnique({
      where: {
        username: body.username,
      },
    });

    if (findUserByUsername) {
      throw new AppError(409, 'Username already exists');
    }

    // 2. Check whether the email already exists
    const findUserByEmail = await prisma.users.findUnique({
      where: {
        email: body.email,
      },
    });

    if (findUserByEmail) {
      throw new AppError(409, 'Email already exists');
    }

    // 3. Validate the referral code, if provided
    const referralCodeInput =
      body.role === 'CUSTOMER'
        ? body.referralCode?.trim().toUpperCase()
        : undefined;

    let referrer: { id: string } | null = null;

    if (referralCodeInput) {
      referrer = await prisma.users.findUnique({
        where: { referralCode: referralCodeInput },
        select: { id: true },
      });

      if (!referrer) {
        throw new AppError(404, 'Referral code not found');
      }
    }

    // 4. Hash the password
    const passwordHash = await Bcrypt.hashPassword(body.password);

    // 5. Generate a unique referral code for the new user
    let referralCode = '';

    do {
      referralCode = `JOVLEN-${randomBytes(4).toString('hex').toUpperCase()}`;
    } while (
      await prisma.users.findUnique({
        where: { referralCode },
        select: { id: true },
      })
    );

    console.log('REFERRAL INPUT:', referralCodeInput);
    console.log('REFERRER FOUND:', referrer);

    // 6. Create the user and process referral rewards atomically
    const user = await prisma.$transaction(async (tx) => {
      // Create the new user
      const newUser = await tx.users.create({
        data: {
          username: body.username,
          email: body.email,
          passwordHash,
          role: body.role,
          referralCode,
          referredByUserId: referrer?.id,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          referralCode: true,
          referredByUserId: true,
          totalPoints: true,
          createdAt: true,
        },
      });

      // 7. Give 10,000 points to the referrer
      if (referrer) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        await tx.users.update({
          where: { id: referrer.id },
          data: {
            totalPoints: { increment: 10000 },
          },
        });

        console.log('CREATING POINT LOT:', {
          userId: referrer.id,
          referredUserId: newUser.id,
          pointsRemaining: 10000,
        });

        const pointLot = await tx.pointLots.create({
          data: {
            userId: referrer.id,
            referredUserId: newUser.id,
            pointsRemaining: 10000,
            status: 'AVAILABLE',
            expiresAt,
          },
        });

        console.log('POINT LOT CREATED:', pointLot);
      }

      return newUser;
    });

    const { id, referredByUserId, ...userResponse } = user;

    return userResponse;
  }

  // // TAMBAHAN READ: mengambil semua data user
  // static async getUsers() {
  //   const users = await prisma.users.findMany({
  //     select: {
  //       id: true,
  //       username: true,
  //       email: true,
  //       role: true,
  //       referralCode: true,
  //       referredByUserId: true,
  //       totalPoints: true,
  //       createdAt: true,
  //     },
  //   });

  //   return users;
  // }

  // LOGIN: login menggunakan email atau username
  static async login({ body }: { body: LoginUserInput }) {
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: body.identifier }, { username: body.identifier }],
      },
    });

    if (!user) {
      throw new AppError(401, 'Invalid email/username or password');
    }

    const isPasswordValid = await Bcrypt.comparePassword(
      body.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email/username or password');
    }

    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
      throw new AppError(500, 'JWT secret key is not configured');
    }

    const expiresIn: SignOptions['expiresIn'] = '1d';

    const token = await Jwt.generate(
      {
        id: user.id,
        role: user.role,
      },
      secretKey,
      { expiresIn },
    );

    const { id, passwordHash, referredByUserId, ...userResponse } = user;

    return {
      token,
      user: userResponse,
    };
  }

  // ME: mengambil data user yang sedang login
  static async me(id: string) {
    const user = await prisma.users.findUnique({
      where: {
        id,
      },
      select: {
        username: true,
        email: true,
        role: true,
        referralCode: true,
        totalPoints: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }
}
