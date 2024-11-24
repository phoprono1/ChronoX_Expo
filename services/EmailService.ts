import { config } from '@/constants/Config';

export const sendVerificationEmail = async (
  userId: string,
  name: string,
  email: string
) => {
  try {
    const response = await fetch(`${config.NEXT_PUBLIC_APP_URL}/api/auth/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Lỗi gửi email xác thực');
    }

    const data = await response.json();
    console.log('Verification email response:', data);
    return data;

  } catch (error) {
    console.error('Send verification email error:', error);
    throw error;
  }
};