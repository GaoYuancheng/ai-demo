import request from "@/utils/request";
import { Result, FileUploadResponse } from "@/types";

export const fileApi = {
  upload: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await request.post<Result<FileUploadResponse>>(
      "/file/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  },
};
