import request from "@/utils/request";
import { Result, LoginRequest, LoginResponse, UserInfo } from "@/types";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await request.post<Result<LoginResponse>>(
      "/auth/login",
      data,
    );
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await request.post<Result<null>>("/auth/logout");
  },
};

export const userApi = {
  getUserInfo: async (): Promise<UserInfo> => {
    const response = await request.get<Result<UserInfo>>("/user/info");
    return response.data.data;
  },
};
