import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Use port 5001 by default because port 5000 is reserved on macOS by AirPlay / AirTunes (ControlCenter)
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET || 'abes_placement_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  collegeCode: '032',
  collegeName: 'ABES Engineering College',
  uploadDir: process.env.UPLOAD_DIR || 'public/uploads',
};

export default config;
