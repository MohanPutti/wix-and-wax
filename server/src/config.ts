import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/wix_and_wax',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Upload
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default

  // Razorpay
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // PhonePe
  phonePeMerchantId: process.env.PHONEPE_MERCHANT_ID || '',
  phonePeSaltKey: process.env.PHONEPE_SALT_KEY || '',
  phonePeSaltIndex: process.env.PHONEPE_SALT_INDEX || '1',
  phonePeEnvironment: (process.env.PHONEPE_ENVIRONMENT || 'uat') as 'production' | 'uat',
  phonePeCallbackUrl: process.env.PHONEPE_CALLBACK_URL || 'http://localhost:3001/api/payments/phonepe/callback',
  phonePeRedirectUrl: process.env.PHONEPE_REDIRECT_URL || 'http://localhost:5173/payment/status',
}
