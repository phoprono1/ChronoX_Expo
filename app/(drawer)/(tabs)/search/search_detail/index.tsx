import * as FuseModule from "fuse.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
import { ArrowLeft, Search, SearchIcon, X } from "lucide-react-native";
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
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import { getFileDownload, getFileUrl } from "@/constants/AppwriteFile";
import { router } from "expo-router";
import RenderUser from "@/components/search/RenderUser";
import RenderPost from "@/components/search/RenderPost";
import { FlashList } from "@shopify/flash-list";

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

const SearchScreen: React.FC = () => {
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

  // Thêm hàm loadSearchHistory
  const loadSearchHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch sử tìm kiếm:", error);
    }
  };

  // Thêm hàm saveSearchHistory
  const saveSearchHistory = async (searchTerm: string) => {
    try {
      const updatedHistory = [
        searchTerm,
        ...searchHistory.filter((term) => term !== searchTerm),
      ].slice(0, 10); // Giữ tối đa 10 lịch sử tìm kiếm

      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error("Lỗi khi lưu lịch sử tìm kiếm:", error);
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
      if (isSearchingRef.current || !debouncedSearchText.trim()) return;

      // Lưu từ khóa tìm kiếm vào lịch sử
      await saveSearchHistory(debouncedSearchText.trim());

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
    <View className="flex-row items-center justify-between py-2 mx-4 border-b border-[#D2B48C]">
      <TouchableOpacity onPress={() => setSearchText(item)} className="flex-1">
        <Text className="text-base text-[#2F1810] font-medium">{item}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeSearchItem(item)}>
        <X size={20} color="#8B4513" />
      </TouchableOpacity>
    </View>
  );

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    loadSearchHistory();
  }, []);

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
    router.navigate({
      pathname: "../../../../(functions)/userInfo/[userInfo]",
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

  return (
    <View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#F5F5F0",
          zIndex: 1000,
        },
      ]}
    >
      <View style={{ paddingTop: statusBarHeight }} className="flex-1">
        <View className="flex-row items-center px-4 py-2 border-b border-[#D2B48C] bg-[#F5F5F0]">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <ArrowLeft size={24} color="#8B4513" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center bg-white rounded-full px-4 py-2 border border-[#D2B48C]">
            <Search size={20} color="#8B4513" />
            <TextInput
              className="flex-1 ml-2 text-[#2F1810]"
              placeholder="Tìm kiếm bài viết, người dùng, hashtag..."
              placeholderTextColor="#8B7355"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <X size={20} color="#8B4513" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {searchState === "idle" && searchHistory.length > 0 && (
          <View className="pt-4">
            <Text
              className="px-4 pb-2 text-[#8B7355] text-sm font-medium italic"
            >
              Lịch sử tìm kiếm
            </Text>
            <FlatList
              data={searchHistory}
              renderItem={renderSearchHistoryItem}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>
        )}

        {searchState === "loading" ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#8B4513" />
          </View>
        ) : (
          <FlashList
            data={searchResults}
            renderItem={renderSearchResult}
            estimatedItemSize={100}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={{
              paddingVertical: 8,
              backgroundColor: "#CEC6B5",
            }}
            onEndReached={loadMoreSearchResults}
            onEndReachedThreshold={0.5}
            drawDistance={500}
            ListFooterComponent={
              loadingMore ? (
                <View className="py-4">
                  <ActivityIndicator size="small" color="#8B4513" />
                </View>
              ) : null
            }
            ListEmptyComponent={() =>
              searchState === "completed" ? (
                <View className="flex-1 items-center justify-center py-8">
                  <Text
                    className="text-[#8B7355] text-base italic"
                  >
                    Không tìm thấy kết quả nào
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
};

export default SearchScreen;
