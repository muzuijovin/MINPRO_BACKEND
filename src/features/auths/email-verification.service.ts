
import { randomInt, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { prisma } from '../../config/prisma-cllient.config';
import { AppError } from '../../errors/app.error';
import transporter from '../../lib/transporter.lib';

export class EmailVerificationService {
  static async sendOtp(emailInput: string) {
    const email = emailInput.trim().toLowerCase();

    const existingUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError(409, 'Email already exists');
    }

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.emailVerifications.upsert({
      where: { email },
      update: {
        otpHash,
        expiresAt,
        attempts: 0,
        verifiedAt: null,
      },
      create: {
        email,
        otpHash,
        expiresAt,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: email,
        subject: 'Kode Verifikasi Email - JOVLEN',
        text: `Kode OTP JOVLEN kamu adalah ${otp}. Kode ini berlaku selama 5 menit.`,
        html: `
          <h2>Verifikasi Email JOVLEN</h2>
          <p>Gunakan kode berikut untuk memverifikasi email kamu:</p>
          <h1 style="letter-spacing: 8px">${otp}</h1>
          <p>Kode berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.</p>
        `,
      });
    } catch {
      await prisma.emailVerifications.deleteMany({ where: { email } });
      throw new AppError(500, 'Failed to send verification email');
    }

    return { email, message: 'OTP sent successfully' };
  }

  static async verifyOtp(emailInput: string, otpInput: string) {
    const email = emailInput.trim().toLowerCase();
    const otp = otpInput.trim();

    const verification = await prisma.emailVerifications.findUnique({
      where: { email },
    });

    if (!verification) {
      throw new AppError(400, 'Request an OTP first');
    }

    if (verification.verifiedAt) {
      throw new AppError(400, 'Email already verified');
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      throw new AppError(400, 'OTP expired. Request a new OTP');
    }

    if (verification.attempts >= 5) {
      throw new AppError(429, 'Too many attempts. Request a new OTP');
    }

    const inputHash = createHash('sha256').update(otp).digest();
    const savedHash = Buffer.from(verification.otpHash, 'hex');

    const matches =
      /^\d{6}$/.test(otp) &&
      savedHash.length === inputHash.length &&
      timingSafeEqual(savedHash, inputHash);

    if (!matches) {
      await prisma.emailVerifications.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });

      throw new AppError(400, 'Invalid OTP');
    }

    const verified = await prisma.emailVerifications.updateMany({
      where: {
        email,
        otpHash: verification.otpHash,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: 5 },
      },
      data: { verifiedAt: new Date() },
    });

    if (verified.count !== 1) {
      throw new AppError(400, 'OTP is no longer valid');
    }

    // Token sementara untuk mengikat verifikasi dengan proses registrasi.
    const registrationToken = randomBytes(32).toString('hex');
    const registrationTokenHash = createHash('sha256')
      .update(registrationToken)
      .digest('hex');

    await prisma.emailVerifications.update({
      where: { email },
      data: { otpHash: registrationTokenHash },
    });

    return {
      email,
      registrationToken,
      message: 'Email verified successfully',
    };
  }
}
