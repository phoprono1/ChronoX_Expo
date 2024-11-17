import { client } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { Platform } from "react-native";
import { Functions } from "react-native-appwrite";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";

class NotificationManager {
  private static instance: NotificationManager;
  private messageUnsubscribe: (() => void) | null = null;
  private isInitialized: boolean = false;
  private processedMessageIds: Set<string> = new Set();
  private static DUPLICATE_TIMEOUT = 60000; // 60 seconds

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public async initialize() {
    if (this.isInitialized) {
      console.log('Notification service already initialized');
      return;
    }

    try {
      await this.requestPermissions();
      await this.setupMessageListener();
      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
      throw error;
    }
  }

  private async setupMessageListener() {
    if (this.messageUnsubscribe) {
      console.log('Cleaning up existing message listener');
      this.messageUnsubscribe();
      this.messageUnsubscribe = null;
    }
  
    console.log('Setting up new message listener');
    
    // Foreground handler
    this.messageUnsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Received foreground message:', remoteMessage);
      const messageId = remoteMessage.messageId;
      
      if (!messageId || this.processedMessageIds.has(messageId)) {
        console.log('Skipping duplicate message:', messageId);
        return;
      }
  
      this.processedMessageIds.add(messageId);
      console.log('Processing message:', messageId);
  
      try {
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
  
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification?.title || '',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data || {},
          },
          trigger: null,
        });
  
        console.log('Notification scheduled successfully');
  
        setTimeout(() => {
          this.processedMessageIds.delete(messageId);
          console.log('Message ID removed from processed set:', messageId);
        }, NotificationManager.DUPLICATE_TIMEOUT);
        
      } catch (error) {
        console.error('Error showing notification:', error);
        this.processedMessageIds.delete(messageId);
      }
    });
  
    // Background handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Received background message:', remoteMessage);
      return Promise.resolve();
    });
  
    console.log('Message listeners setup completed');
  }

  private async requestPermissions() {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('iOS authorization status:', authStatus);
      }
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }
    }
  }

  public cleanup() {
    if (this.messageUnsubscribe) {
      this.messageUnsubscribe();
      this.messageUnsubscribe = null;
    }
    this.processedMessageIds.clear();
    this.isInitialized = false;
    console.log('Notification service cleaned up');
  }

  // Token management methods
  public async getToken(): Promise<string | null> {
    try {
      return await messaging().getToken();
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }
}

// Export public methods
export const initializeNotifications = async () => {
  await NotificationManager.getInstance().initialize();
};

export const cleanupNotifications = () => {
  NotificationManager.getInstance().cleanup();
};

export const registerForPushNotificationsAsync = async () => {
  const manager = NotificationManager.getInstance();
  return await manager.getToken();
};

export const sendPushNotification = async (
  targetId: string,
  title: string,
  message: string,
  data?: object
) => {
  try {
    const functions = new Functions(client);
    
    // Đảm bảo payload là string và đúng format
    const payload = JSON.stringify({
      targetId: String(targetId),
      title: String(title),
      message: String(message),
      data: data || {}
    });

    console.log('Sending payload:', payload);

    const response = await functions.createExecution(
      config.functionId,
      payload,
      false,  // async
      'POST'   // method
    );

    // Kiểm tra response trước khi parse
    console.log('Raw response:', response);
    
    // Xử lý response body an toàn hơn
    let result;
    try {
      result = typeof response.responseBody === 'string' 
        ? JSON.parse(response.responseBody)
        : response.responseBody;
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error('Invalid response format');
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to send notification');
    }

    return result;

  } catch (error: any) {
    console.error('Notification error details:', {
      error: error.message,
      payload: {
        targetId,
        title,
        message,
        data
      }
    });
    throw error;
  }
};

export const sendBulkPushNotifications = async (
  tokens: string[],
  title: string,
  message: string,
  data?: object
) => {
  try {
    const functions = new Functions(client);
    
    const payload = JSON.stringify({
      tokens: tokens,
      title: String(title),
      message: String(message),
      data: {
        ...data,
        type: 'new_post',
        timestamp: new Date().toISOString()
      }
    });

    console.log('Sending bulk notifications:', {
      tokenCount: tokens.length,
      title,
      message
    });

    const response = await functions.createExecution(
      config.functionId,
      payload,
      false, // Đổi thành false để đợi response
      'POST'
    );

    // Kiểm tra response có body không
    if (!response.responseBody) {
      console.log('Empty response from function');
      return {
        success: true,
        message: 'Notification sent but no response body'
      };
    }

    // Parse response an toàn
    let result;
    try {
      result = typeof response.responseBody === 'string' && response.responseBody
        ? JSON.parse(response.responseBody)
        : response.responseBody;
    } catch (e) {
      console.log('Response body:', response.responseBody);
      console.error('Parse error:', e);
      return {
        success: true,
        message: 'Notification sent but invalid response format',
        rawResponse: response.responseBody
      };
    }

    return result;

  } catch (error) {
    console.error('Bulk notification error:', error);
    throw error;
  }
};