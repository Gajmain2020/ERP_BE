export const DB_NAME = "ERP";

interface ErrorResponse {
  message: string;
  success: boolean;
  errorMessage: string;
}

export const Error500 = (error: Error): ErrorResponse => ({
  message: "Internal server error",
  success: false,
  errorMessage: error.message,
});
