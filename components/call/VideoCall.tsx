import React, { useEffect, useState } from "react";
import {
  View,
  Platform,
  PermissionsAndroid,
  Alert,
  TouchableOpacity,
  Text,
} from "react-native";
import createAgoraRtcEngine, {
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  VideoSourceType,
  RtcSurfaceView,
  RtcConnection,
  ChannelMediaOptions,
} from "react-native-agora";
import { Ionicons } from "@expo/vector-icons";
import { config } from "@/constants/Config";

interface Props {
  channelName: string;
  onEndCall: () => void;
}

const VideoCall: React.FC<Props> = ({ channelName, onEndCall }) => {
  const [engine, setEngine] = useState<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const AGORA_APP_ID = config.agoraAppId;

  // Định nghĩa joinChannel một lần
  const joinChannel = async (agoraEngine?: IRtcEngine) => {
    try {
      const currentEngine = agoraEngine || engine; // Sửa this.engine thành engine
      if (!currentEngine) {
        console.error("Engine not initialized");
        return;
      }

      await currentEngine.setChannelProfile(
        ChannelProfileType.ChannelProfileCommunication
      );
      await currentEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      const options: ChannelMediaOptions = {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
        // Thêm các options sau
        autoSubscribeVideo: true,
        autoSubscribeAudio: true,
      };

      console.log("Attempting to join channel:", channelName);
      await currentEngine.joinChannel("", channelName, 0, options); // Bỏ config.agoraToken
      console.log("Join channel attempt completed");
    } catch (e) {
      console.error("Error joining channel:", e);
    }
  };

  useEffect(() => {
    initEngine();
    return () => {
      engine?.release();
    };
  }, []);

  // Sửa lại initEngine
  const initEngine = async () => {
    try {
      if (Platform.OS === "android") {
        await requestPermissions();
      }

      const agoraEngine = createAgoraRtcEngine();
      agoraEngine.initialize({
        appId: AGORA_APP_ID,
      });

      agoraEngine.enableVideo();

      agoraEngine.addListener("onError", (err: number) => {
        console.error("Error", err);
      });

      agoraEngine.addListener(
        "onUserJoined",
        (connection: RtcConnection, uid: number) => {
          console.log("UserJoined", uid);
          setRemoteUid(uid);
        }
      );

      agoraEngine.addListener(
        "onUserOffline",
        (connection: RtcConnection, uid: number) => {
          console.log("UserOffline", uid);
          setRemoteUid(null);
        }
      );

      agoraEngine.addListener(
        "onJoinChannelSuccess",
        (connection: RtcConnection) => {
          console.log("JoinChannelSuccess", connection.channelId);
          setJoined(true);
        }
      );

      setEngine(agoraEngine);
      await joinChannel(agoraEngine); // Gọi joinChannel với engine mới
    } catch (e) {
      console.error(e);
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      if (
        granted["android.permission.RECORD_AUDIO"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted["android.permission.CAMERA"] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log("Permissions granted");
      } else {
        console.log("Permissions denied");
        Alert.alert(
          "Permissions required",
          "Please grant camera and microphone permissions"
        );
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const endCall = async () => {
    try {
      await engine?.leaveChannel();
      onEndCall();
    } catch (e) {
      console.error(e);
    }
  };

  // Sửa lại useEffect cho channelName
  useEffect(() => {
    if (channelName && engine) {
      joinChannel();
    }

    return () => {
      console.log("Leaving channel:", channelName);
      engine?.leaveChannel();
    };
  }, [channelName, engine]);

  useEffect(() => {
    console.log("Joined status:", joined);
    console.log("Remote UID:", remoteUid);
    console.log("Video enabled:", isVideoEnabled);
  }, [joined, remoteUid, isVideoEnabled]);

  useEffect(() => {
    if (engine) {
      engine.addListener('onLocalVideoStateChanged', 
        (state: number, error: number) => {
          console.log('Local video state changed:', state, error);
      });
      engine.addListener(
        "onUserJoined",
        (connection: RtcConnection, uid: number) => {
          console.log("UserJoined", uid);
          setRemoteUid(uid);
          // Đảm bảo local video vẫn được bật
          engine.enableLocalVideo(true);
          engine.startPreview();
        }
      );
    }
  }, [engine]);

  return (
    <View className="flex-1 bg-black relative">
      {/* Video của người được gọi (remote) - chiếm toàn màn hình */}
      {remoteUid !== null ? (
        <View className="flex-1">
          <RtcSurfaceView
            className="flex-1"
            canvas={{
              uid: remoteUid,
              sourceType: VideoSourceType.VideoSourceRemote,
              renderMode: 1,
            }}
            connection={{
              channelId: channelName,
            }}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">
            Đang đợi người dùng tham gia...
          </Text>
        </View>
      )}

      {joined && (
        <View className="absolute top-10 right-5 w-[120px] h-[180px] rounded-xl overflow-hidden border-2 border-white">
          <RtcSurfaceView
            className="flex-1"
            canvas={{
              uid: 0,
              sourceType: VideoSourceType.VideoSourceCamera,
              backgroundColor: 0xff000000,
              renderMode: 1,
              mirrorMode: 1, // Thêm mirror mode nếu cần
            }}
            zOrderMediaOverlay={true} // Đảm bảo local view hiển thị trên cùng
          />
        </View>
      )}

      {/* Nút điều khiển */}
      <View className="absolute bottom-10 w-full flex-row justify-center space-x-4">
        {/* Nút tắt/bật camera */}
        <TouchableOpacity
          className="w-14 h-14 bg-gray-600 rounded-full items-center justify-center"
          onPress={() => {
            if (engine) {
              const newVideoState = !isVideoEnabled;
              engine.enableLocalVideo(newVideoState);
              setIsVideoEnabled(newVideoState);
              if (newVideoState) {
                engine.startPreview(); // Bắt đầu xem trước video nếu bật
              } else {
                engine.stopPreview(); // Dừng xem trước video nếu tắt
              }
            }
          }}
        >
          <Ionicons
            name={isVideoEnabled ? "videocam" : "videocam-off"}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        {/* Nút lật camera */}
        <TouchableOpacity
          className="w-14 h-14 bg-gray-600 rounded-full items-center justify-center"
          onPress={() => {
            engine?.switchCamera();
          }}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>

        {/* Nút kết thúc cuộc gọi */}
        <TouchableOpacity
          onPress={endCall}
          className="w-14 h-14 bg-red-500 rounded-full items-center justify-center"
        >
          <Ionicons name="call" size={24} color="white" />
        </TouchableOpacity>

        {/* Nút tắt/bật mic */}
        <TouchableOpacity
          className="w-14 h-14 bg-gray-600 rounded-full items-center justify-center"
          onPress={() => {
            engine?.enableLocalAudio(!isAudioEnabled);
            setIsAudioEnabled(!isAudioEnabled);
          }}
        >
          <Ionicons
            name={isAudioEnabled ? "mic" : "mic-off"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VideoCall;
