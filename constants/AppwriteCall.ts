import { ID } from "react-native-appwrite";
import { databases } from "./AppwriteClient";
import { config } from "./Config";

export const initiateCall = async (callerId: string | string[], receiverId: string | string[]) => {
    const channelName = `${callerId}-${receiverId}`;
    console.log(channelName);
    
    await databases.createDocument(
      config.databaseId,
      config.callsCollectionId,
      ID.unique(),
      {
        caller: callerId,
        receiver: receiverId,
        channelName,
        status: 'pending',
      }
    );
  };