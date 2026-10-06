/**
 * Client API unifié et allégé.
 * Les notifications externes (WhatsApp / Email) ont été retirées au profit
 * des notifications système et Web Push in-app.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  type?: string;
}

export async function sendEmailApi(_payload: any): Promise<ApiResponse> {
  return { success: true };
}

export async function sendWhatsappApi(_payload: any): Promise<ApiResponse> {
  return { success: true };
}
