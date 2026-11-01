import { AppError } from '../../errors/app.error';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../config/prisma-cllient.config';
import { RegisterUserInput } from '../../validators/auths.validator';
import type {
  LoginUserInput,
  SetPasswordUserInput,
  ChangePasswordUserInput,
} from '../../validators/auths.validator';
import { Bcrypt } from '../../lib/bcrypt.lib';
import { Jwt } from '../../lib/jwt.lib';

export class AuthsService {
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

    // 1. Validasi referral code yang dimasukkan Customer
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

    // 2. Hash password
    const passwordHashed = await Bcrypt.hashPassword(body.password);

    // 3. Generate referral code baru untuk Customer
    let referralCode = '';

    do {
      referralCode = `JOVLEN-${randomBytes(4).toString('hex').toUpperCase()}`;
    } while (
      await prisma.users.findUnique({
        where: { referralCode },
        select: { id: true },
      })
    );

    // 4. Buat akun dan proses reward dalam satu transaksi
    const users = await prisma.$transaction(async (tx) => {
      // Kode create() kamu tetap digunakan di sini
      const newUser = await tx.users.create({
        data: {
          ...body,
          role: 'CUSTOMER',
          password: passwordHashed,
          referralCode,
          referredByUserId: referrer?.id,
        },
      });

      // 6. Berikan 10.000 poin kepada pemilik referral
      if (referrer) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        await tx.users.update({
          where: { id: referrer.id },
          data: {
            totalPoints: { increment: 10000 },
          },
        });

        // 7. Simpan catatan poin beserta masa berlakunya
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

    // 8. Jangan kirim informasi sensitif dalam response
    const { id, referredByUserId, password, ...userWithoutPassword } = users;

    return userWithoutPassword;
  }

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
        password: passwordHashed,
      },
      where: {
        id: params?.userId,
      },
    });

    const { password, ...safeUser } = user;

    return { safeUser };
  }

  // FEATURE 2 - NOMOR 2: Change Password Customer dan EO
  static async changePassword({
    userId,
    body,
  }: {
    userId: string;
    body: ChangePasswordUserInput['body'];
  }) {
    // 1. Cari user yang sedang login
    const findUser = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!findUser) {
      throw new AppError(404, 'User not found');
    }

    // 2. Periksa apakah password lama benar
    const isComparePassword = await Bcrypt.comparePassword(
      body.oldPassword,
      findUser.password,
    );

    if (!isComparePassword) {
      throw new AppError(400, 'Current password is incorrect');
    }

    // 3. Pastikan password baru berbeda dari password lama
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

    // 4. Hash password baru
    const passwordHashed = await Bcrypt.hashPassword(body.newPassword);

    // 5. Simpan password baru ke database
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
}
