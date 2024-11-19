const BASE_URL = 'https://provinces.open-api.vn/api';

export const getProvinces = async () => {
  try {
    const response = await fetch(`${BASE_URL}/`);
    const data = await response.json();
    return data.map((province: any) => ({
      name: province.name,
      code: province.code,
      codename: province.codename
    }));
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tỉnh thành:', error);
    return [];
  }
};

export const searchLocation = async (keyword: string) => {
  try {
    const response = await fetch(`${BASE_URL}/p/search/?q=${encodeURIComponent(keyword)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm địa điểm:', error);
    return [];
  }
};