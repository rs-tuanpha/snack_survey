/**
 * Error types for API responses
 */

import { HttpStatusCode } from "axios";

export interface ApiError {
  message: string;
  code: number;
  details?: any;
  originalError?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  details?: any;
  timestamp: string;
}

// User-friendly error messages
export const ERROR_MESSAGES: Partial<Record<HttpStatusCode, string>> = {
  [HttpStatusCode.BadRequest]: 'Dữ liệu không hợp lệ',
  [HttpStatusCode.Unauthorized]: 'Bạn cần đăng nhập để tiếp tục',
  [HttpStatusCode.Forbidden]: 'Bạn không có quyền thực hiện hành động này',
  [HttpStatusCode.NotFound]: 'Không tìm thấy dữ liệu',
  [HttpStatusCode.Conflict]: 'Dữ liệu đã tồn tại',
  [HttpStatusCode.UnprocessableEntity]: 'Dữ liệu không hợp lệ',
  [HttpStatusCode.InternalServerError]: 'Lỗi máy chủ, vui lòng thử lại sau',
  [HttpStatusCode.BadGateway]: 'Lỗi kết nối máy chủ',
  [HttpStatusCode.ServiceUnavailable]: 'Dịch vụ tạm thời không khả dụng',
  [HttpStatusCode.GatewayTimeout]: 'Hết thời gian chờ phản hồi từ máy chủ'
};
