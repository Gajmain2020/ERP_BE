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

// Utility function for consistent error logging
export function LogOutError(error: Error): void {
  console.error(`
    #################################################################
    ERROR MESSAGE: ${error.message}
    ***************************************************************
    ERROR DETAILS: ${error}
    #################################################################
    `);
}

export const reqString = {
  type: String,
  required: true,
};
