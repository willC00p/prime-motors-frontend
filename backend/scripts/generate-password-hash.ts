import bcrypt from 'bcrypt';

const generateHash = async () => {
  const password = 'password123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Generated hash for password:', hash);
};

generateHash().catch(console.error);
