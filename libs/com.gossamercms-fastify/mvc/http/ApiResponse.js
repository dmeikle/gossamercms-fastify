export class ApiResponse {
  constructor(status, data, message = null) {
    this.status = status;
    this.data = data;
    this.message = message;
  }

  static ok(data) {
    return new ApiResponse(200, data, null);
  }
}
