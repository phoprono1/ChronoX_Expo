import { account, databases, avatars } from "./AppwriteClient";
import { uploadFile } from "./AppwriteFile";
import { config } from "./Config";
import { ID, Models, Query } from "react-native-appwrite";

export const createUser = async (
  username: string,
  email: string,
  password: string
) => {
  try {
    const response = await account.create(
      ID.unique(),
      email,
      password,
      username
    );
    const avatar = avatars.getInitials(username, 30, 30);
    const userDocument = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountID: response.$id,
        username,
        email,
        avatarId: avatar,
        bio: "",
        followed: 0,
        follower: 0,
        location: null,
        website: null,
      }
    );
  } catch (error) {
    console.error("Đăng ký thất bại:", error);
  }
};

// Các phương thức khác như signInUser, updateAvatar, getUserInfo cũng có thể được thêm vào đây.
// Phương thức xử lý đăng nhập
export const signInUser = async (email: string, password: string) => {
  try {
    // Tạo phiên đăng nhập cho người dùng
    const response = await account.createEmailPasswordSession(email, password);
    console.log("response session", response);
    // Tạo JWT cho phiên đăng nhập
    const jwtResponse = await account.createJWT();
    const jwt = jwtResponse.jwt;

    // Lấy thông tin user hiện tại
    const currentUser = await getUserInfo();

    return {
      jwt,
      userId: currentUser.$id,
    };
  } catch (error) {
    console.error("Đăng nhập thất bại:", error);
    throw error;
  }
};

// Tạo user mới từ Google account
export const createGoogleUser = async (
  username: string,
  email: string,
  password: string,
  photoUrl?: string
) => {
  try {
    const response = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    // Sử dụng ảnh Google nếu có, không thì dùng avatar mặc định
    const avatarId = photoUrl || avatars.getInitials(username, 30, 30);

    const userDocument = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountID: response.$id,
        username,
        email,
        avatarId,
        bio: "",
        followed: 0,
        follower: 0,
        location: null,
        website: null,
        provider: "google", // Đánh dấu là tài khoản Google
      }
    );
    return userDocument;
  } catch (error) {
    console.error("Đăng ký Google thất bại:", error);
    throw error;
  }
};

// Đăng nhập user Google (chỉ cần email)
// Kiểm tra xem email đã tồn tại và có phải tài khoản Google không
export const checkGoogleAccount = async (email: string) => {
  try {
    const users = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("email", email)]
    );

    if (users.documents.length > 0) {
      const user = users.documents[0];
      return {
        exists: true,
        isGoogleAccount: user.provider === "google",
      };
    }

    return {
      exists: false,
      isGoogleAccount: false,
    };
  } catch (error) {
    console.error("Lỗi kiểm tra tài khoản:", error);
    throw error;
  }
};

// Sửa lại hàm signInGoogleUser để kiểm tra provider
export const signInGoogleUser = async (email: string) => {
  try {
    const { exists, isGoogleAccount } = await checkGoogleAccount(email);

    if (!exists) {
      throw new Error("Tài khoản không tồn tại");
    }

    if (!isGoogleAccount) {
      throw new Error("Email này đã được đăng ký với phương thức khác");
    }

    // Tạo phiên đăng nhập với email làm password
    const response = await account.createEmailPasswordSession(email, email);
    const jwtResponse = await account.createJWT();
    const jwt = jwtResponse.jwt;

    const currentUser = await getUserInfo();

    return {
      jwt,
      userId: currentUser.$id,
    };
  } catch (error) {
    console.error("Đăng nhập Google thất bại:", error);
    throw error;
  }
};

export const updateUserStatus = async (
  userId: string,
  status: "online" | "offline"
) => {
  try {
    await databases.updateDocument(
      config.databaseId,
      config.userCollectionId,
      userId,
      { status: status }
    );
  } catch (error) {
    console.error("Error updating user status:", error);
  }
};

export const updateUserInfo = async (
  userId: string,
  updates: {
    name?: string,
    bio?: string,
    location?: string,
    website?: string
  }
) => {
  try {
    // Lọc bỏ các trường undefined/null/empty string
    const validUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );

    // Chỉ gửi request nếu có dữ liệu cần cập nhật
    if (Object.keys(validUpdates).length > 0) {
      await databases.updateDocument(
        config.databaseId,
        config.userCollectionId,
        userId,
        validUpdates
      );
    }
    
    return true;
  } catch (error) {
    console.error("Error updating user info:", error);
    throw error;
  }
};

// Phương thức cập nhật avatar
export const updateAvatar = async (newAvatarUri: string) => {
  try {
    const currentAccount = await account.get();
    const userDocuments = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountID", currentAccount.$id)]
    );

    if (userDocuments.documents.length === 0) {
      throw new Error("Không tìm thấy tài liệu người dùng.");
    }

    const userId = userDocuments.documents[0].$id; // Lấy ID của tài liệu người dùng

    const date = new Date().toISOString().replace(/T/, "_").replace(/\..+/, ""); // Lấy ngày và giờ hiện tại
    const fileName = `${currentAccount.name}_${date}.jpg`; // Tạo tên file theo định dạng yêu cầu

    // Tạo đối tượng file cho hàm uploadFile
    const file = {
      uri: newAvatarUri,
      fileName: fileName, // Sử dụng tên file đã tạo
      mimeType: "image/jpg", // Đảm bảo loại file là image/jpeg
      fileSize: 0, // Kích thước file, có thể cập nhật sau khi fetch
    };

    // Tải ảnh lên Storage và lấy URL
    const avatarId = await uploadFile(file); // Kiểm tra xem uploadFile có hoạt động không

    // Cập nhật avatar trong cơ sở dữ liệu
    const updatedDocument = await databases.updateDocument(
      config.databaseId,
      config.userCollectionId,
      userId,
      {
        avatarId: avatarId, // Cập nhật URL của avatar mới
      }
    );
  } catch (error) {
    console.error("Lỗi khi cập nhật avatar:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Hàm lấy thông tin người dùng
export const getUserInfo = async () => {
  try {
    const currentAccount = await account.get(); // Lấy thông tin tài khoản hiện tại
    const userDocuments = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountID", currentAccount.$id)]
    );

    if (userDocuments.documents.length > 0) {
      return userDocuments.documents[0]; // Trả về tài liệu người dùng
    }
    throw new Error("Không tìm thấy tài liệu người dùng.");
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Hàm lấy thông tin người dùng dựa trên ID
export const getUserById = async (userId: string) => {
  try {
    const userDocuments = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountID", userId)]
    );

    if (userDocuments.documents.length > 0) {
      return userDocuments.documents[0]; // Trả về thông tin người dùng đầu tiên
    } else {
      throw new Error("Không tìm thấy người dùng. 123");
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    throw error;
  }
};

// Hàm lấy id người dùng hiện tại
export const getCurrentUserId = async (userId: string) => {
  try {
    const userDocuments = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountID", userId)]
    );

    if (userDocuments.documents.length > 0) {
      return userDocuments.documents[0].$id; // Trả về thông tin người dùng đầu tiên
    } else {
      throw new Error("Không tìm thấy người dùng.");
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    throw error;
  }
};
// Phương thức đăng xuất
export const signOutUser = async () => {
  try {
    await account.deleteSession("current"); // Xóa phiên đăng nhập hiện tại
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

export const getAllUsers = async (
  limit = 100,
  cursor: string | null = null
): Promise<Models.DocumentList<Models.Document>> => {
  try {
    let queries = [Query.limit(limit)];
    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }
    const users = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      queries
    );
    return users;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    throw error;
  }
};

export const createUserVerification = async () => {
  try {
    // Tạo URL từ token
    console.log('account', account.createVerification('http://localhost:3000/verify-email'))
    return account.createVerification('http://localhost:3000/verify-email');
  } catch (error) {
    console.error('Create verification error:', error);
    throw error;
  }
};

export const updateUserVerification = async (userId: string, secret: string) => {
  try {
    await account.updateVerification(userId, secret);
    return true;
  } catch (error) {
    console.error('Update verification error:', error);
    throw error;
  }
};

export const updateUserPassword = async (oldPassword: string, newPassword: string) => {
  await account.updatePassword(newPassword, oldPassword);
};

export const getTargetId = async (userId: string) => {
  const user = await account.get();
  console.log("user.targets", user.targets);
  return user.targets;
};

export const checkEmailVerification = async () => {
  const user = await account.get();
  console.log("user.emailVerification", user.emailVerification);
  return user.emailVerification;
};

export const updateUserTargetId = async (userId: string, targetId: string) => {
  try {
    await databases.updateDocument(
      config.databaseId,
      config.userCollectionId,
      userId,
      {
        targetId: targetId,
      }
    );
    console.log("Đã cập nhật targetId cho user:", userId);
  } catch (error) {
    console.error("Lỗi khi cập nhật targetId:", error);
    throw error;
  }
};

// Hàm lấy danh sách target của những người đang follow
export const getFollowerTargets = async (userId: string) => {
  try {
    // Lấy danh sách người theo dõi
    const followers = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId,
      [Query.equal("followed", userId)]
    );

    console.log("Số lượng followers:", followers.documents.length);

    // Lọc và lấy targetId của từng follower
    const followerTargets = await Promise.all(
      followers.documents.map(async (follower) => {
        try {
          // Lấy thông tin user từ follower document
          const userDoc = await databases.getDocument(
            config.databaseId,
            config.userCollectionId,
            follower.follower.$id
          );

          console.log("Tìm thấy user:", userDoc.username);

          // Trả về targetId nếu có
          return userDoc.targetId ? [userDoc.targetId] : [];
        } catch (error) {
          console.error(
            `Lỗi khi lấy targetId của user ${follower.follower.$id}:`,
            error
          );
          return [];
        }
      })
    );

    const uniqueTargets = [...new Set(followerTargets.flat())];
    console.log("Tổng số targets tìm thấy:", uniqueTargets.length);

    return uniqueTargets;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách target:", error);
    throw error;
  }
};
