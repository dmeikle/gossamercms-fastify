export class PrivacyMaskUtils {
  static maskName(value) {
    if (value == null) return null;
    return String(value).trim().split(/\s+/).filter(Boolean)
      .map((part) => `${Array.from(part)[0]}***`).join(' ');
  }

  static maskEmail(value) {
    if (value == null) return null;
    const text = String(value).trim();
    if (!/^[^@\s]+@[^@\s]+$/.test(text)) return '***';
    return `${Array.from(text)[0]}***@***`;
  }

  static maskPhone(value) {
    if (value == null) return null;
    const digits = String(value).replace(/\D/g, '');
    return digits.length > 4 ? `***${digits.slice(-4)}` : '***';
  }
}
