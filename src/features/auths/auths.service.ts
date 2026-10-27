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
    referralCode = `JOVLEN-${randomBytes(4)
      .toString('hex')
      .toUpperCase()}`;
  } while (
    await prisma.users.findUnique({
      where: { referralCode },
      select: { id: true },
    })
  );

  // 4. Pisahkan password dan referral code input
  const {
    password,
    referralCode: _inputReferralCode,
    ...userData
  } = body;

  // 5. Buat akun dan proses reward dalam satu transaksi
  const users = await prisma.$transaction(async (tx) => {
    // Kode create() kamu tetap digunakan di sini
    const newUser = await tx.users.create({
      data: {
        ...userData,
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
  const {
    id,
    referredByUserId,
    password: _password,
    ...userWithoutPassword
  } = users;

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

    const { password, ...userData } = body;
    const users = await prisma.users.create({
      data: {
        ...userData,
        role: 'EO',
        password: passwordHashed,
        referralCode,
      },
    });

    const { id, referredByUserId, password: _password, ...userWithoutPassword } =
      users;

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
      { expiresIn: '30m' },
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
}
