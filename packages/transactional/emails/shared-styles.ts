// Shared styles with updated brand colors
export const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

export const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 24px 48px 24px',
  marginBottom: '64px',
};

export const header = {
  padding: '32px 24px',
  backgroundColor: 'oklch(0.2569 0.1054 29.23)', // --primary
  textAlign: 'center' as const,
};

export const content = {
  padding: '24px',
};

export const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

export const h2 = {
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '24px 0 16px 0',
};

export const h3 = {
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '20px 0 12px 0',
};

export const greeting = {
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
};

export const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

export const successBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

export const successTitle = {
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

export const successMessage = {
  color: '#16a34a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '20px',
};

export const detailsSection = {
  margin: '24px 0',
};

export const detailItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

export const actionSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

export const button = {
  backgroundColor: 'oklch(0.5398 0.2198 29.39)', // --accent
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '16px 0',
};

export const nextStepsSection = {
  margin: '24px 0',
};

export const listItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
};

export const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

export const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 16px 0',
};

export const signature = {
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0 0',
};

export const link = {
  color: 'oklch(0.5398 0.2198 29.39)', // --accent
  textDecoration: 'underline',
};

export const transactionBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

export const transactionHash = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  padding: '8px 12px',
  fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
  fontSize: '12px',
  color: '#475569',
  wordBreak: 'break-all' as const,
  margin: '8px 0',
};

// Additional styles for other email templates
export const alertBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

export const alertTitle = {
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

export const alertReason = {
  color: 'oklch(0.5398 0.2198 29.39)', // --accent
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '20px',
};

// Error box styles for rejected transactions
export const errorBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

export const errorTitle = {
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

export const errorMessage = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '20px',
};

export const reasonSection = {
  margin: '24px 0',
};

// Verification email styles
export const text = {
  color: '#374151',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '24px 0',
};

export const verificationSection = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const validityText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0px',
  textAlign: 'center' as const,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

export const verifyText = {
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
  fontSize: '14px',
  fontWeight: 'bold',
  margin: 0,
  textAlign: 'center' as const,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

export const codeText = {
  color: 'oklch(0.5398 0.2198 29.39)', // --accent
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '10px 0',
  textAlign: 'center' as const,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

export const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: 'bold',
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
  padding: '17px 0 0',
  textAlign: 'center' as const,
};

export const logo = {
  margin: '0 auto',
};

export const fontToken = {
  color: 'oklch(0.5398 0.2198 29.39)', // --accent
  fontSize: '12px',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
};

export const tokenContainer = {
  textAlign: 'center' as const,
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
};

// Welcome email styles
export const logoText = {
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  color: 'oklch(0.2569 0.1054 29.23)', // --primary
};

export const hr = {
  borderColor: '#e8eaed',
  margin: '48px 0 24px',
};

// Contact form styles
export const section = {
  marginBottom: '24px',
};

export const label = {
  color: '#666',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

export const value = {
  color: '#333',
  fontSize: '16px',
  margin: '0',
  lineHeight: '24px',
};

export const emailLink = {
  color: '#2563eb',
  fontSize: '16px',
  textDecoration: 'underline',
};

export const messageText = {
  color: '#333',
  fontSize: '16px',
  margin: '0',
  lineHeight: '24px',
  whiteSpace: 'pre-wrap' as const,
  padding: '16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  border: '1px solid #e9ecef',
};

// Waitlist email styles
export const waitlistMain = {
  backgroundColor: '#000000',
  margin: '0 auto',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

export const waitlistContainer = {
  margin: 'auto',
  padding: '96px 20px 64px',
};

export const waitlistH1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
};

export const waitlistText = {
  color: '#aaaaaa',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 40px',
};
