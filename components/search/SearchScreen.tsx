import * as FuseModule from "fuse.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Share,
  BackHandler,
  Modal,
} from "react-native";
import { ArrowLeft, SearchIcon, X } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllUsers } from "@/constants/AppwriteUser";
import {
  getAllPosts,
  getPostStatistics,
  isPostLiked,
  toggleLikePost,
} from "@/constants/AppwritePost";

import { Models } from "react-native-appwrite";
import RenderUser from "./RenderUser";
import RenderPost from "./RenderPost";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import { getFileDownload, getFileUrl } from "@/constants/AppwriteFile";
import { router } from "expo-router";

interface SearchScreenProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SEARCH_HISTORY_KEY = "search_history";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ visible, onClose }) => {
  const [searchText, setSearchText] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  const [users, setUsers] = useState<Models.Document[]>([]);
  const [posts, setPosts] = useState<Models.Document[]>([]);
  type FuseType = FuseModule.default<Models.Document>;
  type FuseResult = FuseModule.FuseResult<Models.Document>;
  const [userCursor, setUserCursor] = useState<string | null>(null);
  const [postCursor, setPostCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Models.Document[]>([]);
  const [searchState, setSearchState] = useState<
    "idle" | "loading" | "completed"
  >("idle");
  const isSearchingRef = React.useRef(false);
  const debouncedSearchText = useDebounce(searchText, 300);
  const currentUserId = useSelector(
    (state: RootState) => state.currentUser.$id
  );

  const { openBottomSheet } = useBottomSheet();

  const [loadingMore, setLoadingMore] = useState(false);
  const [lastSearchId, setLastSearchId] = useState<string | null>(null);
  const [canLoadMore, setCanLoadMore] = useState(true);

  const fetchMoreData = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newUsers = await getAllUsers(100, userCursor);
      const newPosts = await getAllPosts(100, postCursor);

      setUsers((prevUsers) => [...prevUsers, ...newUsers.documents]);
      setPosts((prevPosts) => [...prevPosts, ...newPosts.documents]);
      setUserCursor(
        newUsers.documents[newUsers.documents.length - 1]?.$id || null
      );
      setPostCursor(
        newPosts.documents[newPosts.documents.length - 1]?.$id || null
      );
    } catch (error) {
      console.error("Lỗi khi tải thêm dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, userCursor, postCursor]);

  // Thêm hàm loadMoreSearchResults
  const loadMoreSearchResults = async () => {
    if (!canLoadMore || loadingMore || !lastSearchId || !searchText.trim())
      return;
    setLoadingMore(true);

    try {
      const moreResults = await getAllPosts(20, lastSearchId);

      if (moreResults.documents.length === 0) {
        setCanLoadMore(false);
        return;
      }

      const fuseOptions = {
        keys: ["title", "hashtags"],
        threshold: 0.4,
      };
      const fuse = new FuseModule.default(moreResults.documents, fuseOptions);
      const searchResults = fuse.search(searchText);

      if (searchResults.length > 0) {
        // Lọc kết quả trùng lặp trước khi thêm vào state
        const newResults = searchResults
          .map((result) => result.item)
          .filter(
            (newItem) =>
              !searchResults.some(
                (existingItem) => existingItem.item.$id === newItem.$id
              )
          );

        if (newResults.length > 0) {
          const enrichedResults = await enrichPostsWithStatistics(newResults);
          setSearchResults((prevResults) => {
            // Thêm kiểm tra trùng lặp một lần nữa khi cập nhật state
            const uniqueResults = [...prevResults];
            enrichedResults.forEach((newResult) => {
              if (
                !uniqueResults.some(
                  (existing) => existing.$id === newResult.$id
                )
              ) {
                uniqueResults.push(newResult);
              }
            });
            return uniqueResults;
          });
          setLastSearchId(
            moreResults.documents[moreResults.documents.length - 1].$id
          );
        } else {
          setCanLoadMore(false);
        }
      } else {
        setCanLoadMore(false);
      }
    } catch (error) {
      console.error("Lỗi khi tải thêm kết quả tìm kiếm:", error);
      setCanLoadMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const fuse = useMemo(() => {
    const allDocuments = [...users, ...posts];
    return new FuseModule.default(allDocuments, {
      keys: ["username", "email", "title", "hashtags"],
      threshold: 0.3,
    });
  }, [users, posts]);

  useEffect(() => {
    fetchMoreData();
  }, []);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.exp),
      });
      opacity.value = withTiming(1, { duration: 200 });
      loadSearchHistory();
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 200,
        easing: Easing.in(Easing.exp),
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const statusBarHeight = Platform.select({
    ios: 44,
    android: StatusBar.currentHeight || 0,
  });

  useEffect(() => {
    if (debouncedSearchText.trim()) {
      setSearchState("loading");
      performSearch(fuse);
    } else {
      setSearchState("idle");
      setSearchResults([]);
    }
  }, [debouncedSearchText, fuse]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history !== null) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const saveSearchHistory = async (term: string) => {
    try {
      const updatedHistory = [
        term,
        ...searchHistory.filter((item) => item !== term),
      ].slice(0, 10);
      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
      setSearchHistory(updatedHistory);
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  const handleSearch = useCallback(() => {
    if (searchText.trim() && searchState !== "loading") {
      saveSearchHistory(searchText.trim());
      setSearchState("loading");
      performSearch(fuse);
    }
  }, [searchText, fuse, searchState]);

  // Thêm hàm để lấy thông tin statistics cho posts
  const enrichPostsWithStatistics = async (results: Models.Document[]) => {
    try {
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          // Chỉ xử lý các item là bài post (có title)
          if ("title" in result) {
            const statisticsPost = await getPostStatistics(result.$id);
            const liked = await isPostLiked(result.$id, currentUserId ?? "");

            return {
              ...result,
              likes: statisticsPost?.likes || 0,
              comments: statisticsPost?.comments || 0,
              isLiked: liked,
            };
          }
          return result;
        })
      );
      return enrichedResults;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin statistics:", error);
      return results; // Trả về kết quả gốc nếu có lỗi
    }
  };

  const performSearch = useCallback(
    async (fuseInstance: FuseType) => {
      if (isSearchingRef.current) return;
      isSearchingRef.current = true;
      setSearchState("loading");

      try {
        const results = fuseInstance.search(debouncedSearchText);

        // Lọc kết quả trùng lặp
        const uniqueResults = results.reduce<FuseResult[]>((acc, current) => {
          const x = acc.find((item) => item.item.$id === current.item.$id);
          if (!x) {
            return acc.concat([current]);
          }
          return acc;
        }, []);

        const finalResults = uniqueResults.map((result) => result.item);

        // Sắp xếp kết quả: người dùng trước, bài đăng sau
        const sortedResults = finalResults.sort((a, b) => {
          if (!("title" in a) && "title" in b) return -1;
          if ("title" in a && !("title" in b)) return 1;
          return 0;
        });

        // Thêm thông tin statistics cho các bài post
        const enrichedResults = await enrichPostsWithStatistics(sortedResults);

        setSearchResults(enrichedResults);
        // Lưu ID cuối cùng cho loadMore
        const lastPost = sortedResults.find((result) => "title" in result);
        setLastSearchId(lastPost?.$id || null);
        setCanLoadMore(true);
        setSearchState("completed");
      } catch (error) {
        console.error("Lỗi trong quá trình tìm kiếm:", error);
        setSearchState("completed");
      } finally {
        isSearchingRef.current = false;
      }
    },
    [debouncedSearchText, currentUserId]
  );

  const removeSearchItem = async (item: string) => {
    const updatedHistory = searchHistory.filter((term) => term !== item);
    setSearchHistory(updatedHistory);
    await AsyncStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(updatedHistory)
    );
  };

  const renderSearchHistoryItem = ({ item }: { item: string }) => (
    <View className="flex-row items-center justify-between py-2 mx-2">
      <TouchableOpacity onPress={() => setSearchText(item)} className="flex-1">
        <Text className="text-base text-gray-700">{item}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeSearchItem(item)}>
        <X size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  // Thêm các hàm xử lý từ trang home
  const handleLike = async (postId: string) => {
    try {
      await toggleLikePost(postId, currentUserId ?? "");

      // Cập nhật state searchResults
      setSearchResults((prevResults) =>
        prevResults.map((result) => {
          if (result.$id === postId && "title" in result) {
            const newLikesCount = result.isLiked
              ? result.likes - 1
              : result.likes + 1;
            return {
              ...result,
              isLiked: !result.isLiked,
              likes: newLikesCount,
            };
          }
          return result;
        })
      );
    } catch (error) {
      console.error("Lỗi khi thích bài viết:", error);
    }
  };

  const handleComment = (postId: string) => {
    openBottomSheet("comment", postId);
  };

  const handleShare = async (postId: string) => {
    try {
      const post = searchResults.find((result) => result.$id === postId);
      if (!post || !("fileIds" in post)) return;

      let fileUrl = getFileUrl(post.fileIds);
      if (Array.isArray(fileUrl)) {
        fileUrl = fileUrl[0];
      }

      if (typeof fileUrl !== "string") {
        throw new Error("URL không hợp lệ");
      }

      const downloadResponse = await getFileDownload(post.fileIds[0]);
      const localFilePath =
        downloadResponse.href || downloadResponse.toString();

      await Share.share({
        url: localFilePath,
        message: post.title,
        title: `Chia sẻ tệp: ${fileUrl.split("/").pop()}`,
      });
    } catch (error) {
      console.error("Lỗi khi chia sẻ file:", error);
    }
  };

  const handleTitlePress = (postId: string) => {
    handleComment(postId); // Mở comment khi nhấn vào title
  };

  const handleHashtagPress = (hashtags: string[]) => {
    // Xử lý khi nhấn vào hashtag
    console.log("Hashtags pressed:", hashtags);
  };

  const handleUserInfoPress = (userId: string) => {
    router.push({
      pathname: "../../../(functions)/userInfo/[userInfo]",
      params: { userInfoId: userId, currentUserId: currentUserId },
    });
  };

  const renderSearchResult = ({ item }: { item: Models.Document }) => {
    if ("title" in item) {
      // Đây là bài đăng
      return (
        <RenderPost
          post={{
            $id: item.$id,
            avatar: item.accountID?.avatarId || "",
            username: item.accountID?.username || "Unknown User",
            email: item.accountID?.email || "",
            fileIds: item.fileIds || [],
            title: item.title,
            hashtags: item.hashtags || [],
            likes: item.likes || 0,
            comments: item.comments || 0,
            isLiked: item.isLiked || false,
          }}
          onLike={() => handleLike(item.$id)}
          onComment={() => handleComment(item.$id)}
          onShare={() => handleShare(item.$id)}
          onTitlePress={() => handleTitlePress(item.$id)}
          onHashtagPress={() => handleHashtagPress(item.hashtags || [])}
          onUserInfoPress={() => handleUserInfoPress(item.accountID?.$id || "")}
        />
      );
    } else {
      // Đây là người dùng
      return (
        <RenderUser
          user={{
            $id: item.$id,
            username: item.username,
            email: item.email,
            avatar: item.avatarId || "",
          }}
          currentUserId={currentUserId}
        />
      );
    }
  };

  // Thêm xử lý back navigation
  useEffect(() => {
    const backHandler = () => {
      if (visible) {
        onClose();
        return true; // Prevent default back behavior
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      backHandler
    );

    return () => subscription.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            zIndex: 1000,
          },
          animatedStyle,
        ]}
      >
        <View style={{ paddingTop: statusBarHeight }} className="flex-1">
          <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 items-center justify-center"
            >
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2 mx-2">
              <SearchIcon size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-base h-10"
                placeholder="Search posts, people, or tags..."
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoFocus
                onSubmitEditing={handleSearch}
              />
            </View>
          </View>
          {searchText ? (
            searchState === "loading" ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            ) : (
              <SafeAreaView className="flex-1 bg-gray-100">
                <FlatList
                  ListHeaderComponent={
                    <View className="h-fit">
                      <Text className="text-base font-medium px-4 py-2">
                        Kết quả tìm kiếm cho "{searchText}"
                      </Text>
                    </View>
                  }
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => `${item.$id}-${item.$createdAt}`} // Thêm timestamp để đảm bảo tính duy nhất
                  onEndReached={loadMoreSearchResults}
                  onEndReachedThreshold={0.5}
                  ListEmptyComponent={
                    <Text className="text-gray-500 px-4 py-2">
                      No results found
                    </Text>
                  }
                  ListFooterComponent={
                    loadingMore ? (
                      <View className="py-4">
                        <ActivityIndicator size="small" color="#0000ff" />
                      </View>
                    ) : null
                  }
                />
              </SafeAreaView>
            )
          ) : (
            <FlatList
              data={searchHistory}
              renderItem={renderSearchHistoryItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              ListHeaderComponent={
                <Text className="text-base font-medium mb-2 px-4 py-2">
                  Recent Searches
                </Text>
              }
              ListEmptyComponent={
                <Text className="text-gray-500 px-4 py-2">
                  No recent searches
                </Text>
              }
            />
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

export default SearchScreen;
