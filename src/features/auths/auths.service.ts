import { AppError } from '../../errors/app.error';
import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '../../config/prisma-client.config';
import { RegisterUserInput } from '../../validators/auths.validator';
import type {
  LoginUserInput,
  ChangePasswordUserInput,
  ForgotPasswordUserInput,
  ResetPasswordUserInput,
} from '../../validators/auths.validator';
import { Bcrypt } from '../../lib/bcrypt.lib';
import { Jwt } from '../../lib/jwt.lib';
import transporter from '../../lib/transporter.lib';

export class AuthsService {
  // Register Customer
  static async registerForCustomer({ body }: RegisterUserInput) {
    const findUsersByEmail = await prisma.users.findUnique({
      where: { email: body.email },
    });

    if (findUsersByEmail) {
      throw new AppError(409, 'Email already exists');
    }

    const findUsersByUsername = await prisma.users.findUnique({
      where: { username: body.username },
    });

    if (findUsersByUsername) {
      throw new AppError(409, 'Username already exists');
    }

    const referralCodeInput = body.referralCode?.trim().toUpperCase();

    let referrer: { id: string } | null = null;

    if (referralCodeInput) {
      referrer = await prisma.users.findUnique({
        where: { referralCode: referralCodeInput },
        select: { id: true },
      });

      if (!referrer) {
        throw new AppError(400, 'Referral code not found');
      }
    }

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

    const users = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          ...body,
          role: 'CUSTOMER',
          password: passwordHashed,
          referralCode,
          referredByUserId: referrer?.id,
        },
      });

      if (referrer) {
        const startAt = new Date();
        const endAt = new Date(startAt);
        endAt.setMonth(endAt.getMonth() + 3);

        await tx.coupons.create({
          data: {
            userId: newUser.id,
            code: `REFERRAL-${randomBytes(8).toString('hex').toUpperCase()}`,
            discountPercentage: 10,
            quota: 1,
            startAt,
            endAt,
            isActive: true,
          },
        });
      }

      if (referrer) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        await tx.users.update({
          where: { id: referrer.id },
          data: {
            totalPoints: { increment: 10000 },
          },
        });

        await tx.pointLots.create({
          data: {
            userId: referrer.id,
            referredUserId: newUser.id,
            pointsRemaining: 10000,
            status: 'AVAILABLE',
            expiresAt,
          },
        });
      }

      return newUser;
    });

    const { id, referredByUserId, password, ...userWithoutPassword } = users;

    return userWithoutPassword;
  }

  // Register EO
  static async registerForEo({ body }: RegisterUserInput) {
    const findUsersByEmail = await prisma.users.findUnique({
      where: {
        email: body?.email,
      },
    });

    if (findUsersByEmail) throw new AppError(409, 'Email already exists');

    const findUsersByUsername = await prisma.users.findUnique({
      where: {
        username: body.username,
      },
    });

    if (findUsersByUsername) {
      throw new AppError(409, 'Username already exists');
    }

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
        password: passwordHashed,
        referralCode,
      },
    });

    const { id, referredByUserId, password, ...userWithoutPassword } = users;

    return userWithoutPassword;
  }

  // Login Customer dan EO
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
      findUserByEmail.password,
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

    const { id, password, ...userWithoutPassword } = findUserByEmail;

    return {
      token,
      userWithoutPassword,
    };
  }

  // Get Current User
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

  // Change Password Customer dan EO
  static async changePassword({
    userId,
    body,
  }: {
    userId: string;
    body: ChangePasswordUserInput['body'];
  }) {
    const findUser = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!findUser) {
      throw new AppError(404, 'User not found');
    }

    const isComparePassword = await Bcrypt.comparePassword(
      body.oldPassword,
      findUser.password,
    );

    if (!isComparePassword) {
      throw new AppError(400, 'Current password is incorrect');
    }

    const isSamePassword = await Bcrypt.comparePassword(
      body.newPassword,
      findUser.password,
    );

    if (isSamePassword) {
      throw new AppError(
        400,
        'New password must be different from current password',
      );
    }

    const passwordHashed = await Bcrypt.hashPassword(body.newPassword);

    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        password: passwordHashed,
      },
    });

    return;
  }

  // FEATURE 2 - NOMOR 2: Forgot Password Customer dan EO
  static async forgotPassword({ body }: ForgotPasswordUserInput) {
    const findUser = await prisma.users.findUnique({
      where: {
        email: body.email,
      },
    });

    // Jangan memberitahukan apakah email terdaftar atau tidak
    if (!findUser || findUser.deletedAt) {
      return;
    }

    // Buat reset token acak
    const token = randomBytes(32).toString('hex');

    // Simpan hash token, bukan token aslinya
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Token berlaku selama 15 menit
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Simpan token ke database
    await prisma.passwordResetTokens.create({
      data: {
        userId: findUser.id,
        tokenHash,
        expiresAt,
      },
    });

    // Link menuju halaman Reset Password frontend
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Mengirim email menggunakan Nodemailer milik dosen
    await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: findUser.email,
      subject: 'Reset Your Jövlen Password',
      html: `
      <h2>Reset Your Password</h2>
      <p>Hello ${findUser.username},</p>
      <p>We received a request to reset your Jövlen password.</p>
      <p>Click the link below to create a new password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
    });

    return;
  }

  // FEATURE 2 - NOMOR 2: Reset Password Customer dan EO
  static async resetPassword({ body }: ResetPasswordUserInput) {
    const tokenHash = createHash('sha256').update(body.token).digest('hex');

    const findToken = await prisma.passwordResetTokens.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!findToken || findToken.usedAt || findToken.expiresAt <= new Date()) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    const findUser = await prisma.users.findUnique({
      where: {
        id: findToken.userId,
      },
    });

    if (!findUser || findUser.deletedAt) {
      throw new AppError(404, 'User not found');
    }

    const passwordHashed = await Bcrypt.hashPassword(body.newPassword);

    // Update password dan tandai token telah digunakan
    await prisma.$transaction(async (tx) => {
      const updatedToken = await tx.passwordResetTokens.updateMany({
        where: {
          id: findToken.id,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (updatedToken.count !== 1) {
        throw new AppError(400, 'Invalid or expired reset token');
      }

      await tx.users.update({
        where: {
          id: findUser.id,
        },
        data: {
          password: passwordHashed,
        },
      });

      // Batalkan token reset lain milik user yang masih aktif
      await tx.passwordResetTokens.updateMany({
        where: {
          userId: findUser.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });
    });

    return;
  }
}
