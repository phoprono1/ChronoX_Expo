import { Functions } from 'react-native-appwrite';
import { client } from '@/constants/AppwriteClient';
import { config } from '@/constants/Config';
import { getTargetId } from '@/constants/AppwriteUser';

export const sendVerificationEmail = async (
  userId: string,
  userName: string,
  userEmail: string
) => {
  try {
    const functions = new Functions(client);
    
    const userTargets = await getTargetId(userId);
    const targetIds = userTargets.map((target: any) => target.$id);

    const payload = JSON.stringify({
      subject: 'Xác thực tài khoản thành công',
      content: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8B4513; text-align: center;">Chúc mừng!</h1>
          <p style="color: #2F1810; font-size: 16px; line-height: 1.5;">
            Xin chào ${userName},
          </p>
          <p style="color: #2F1810; font-size: 16px; line-height: 1.5;">
            Chúc mừng! Tài khoản của bạn đã được xác thực thành công.
            Bây giờ bạn có thể truy cập đầy đủ các tính năng của ứng dụng.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #8B7355; font-size: 14px;">
              Nếu bạn không yêu cầu xác thực này, vui lòng bỏ qua email này.
            </p>
          </div>
        </div>
      `,
      targets: targetIds
    });

    const response = await functions.createExecution(
      config.sendMailId,
      payload
    );

    return response;

  } catch (error) {
    console.error('Verification email error:', error);
    throw error;
  }
};