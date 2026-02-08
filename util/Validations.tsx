export class Validator {
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isName(name: string): boolean {
    const nameRegex = /^[a-zA-Z\s-]{2,50}$/;
    return nameRegex.test(name);
  }

  static isMobile(mobile: string): boolean {
    const mobileRegex = /^\+?[1-9]\d{1,14}$/;
    return mobileRegex.test(mobile);
  }

  static isInt(value: string): boolean {
    const intRegex = /^-?\d+$/;
    return intRegex.test(value);
  }

  static isDouble(value: any): boolean {
    const doubleRegex = /^-?\d*(\.\d+)?$/;
    return doubleRegex.test(value) && !isNaN(parseFloat(value));
  }

  static isPassword(password: string): boolean {
    const passwordRegex = /^.{6,}$/;
    return passwordRegex.test(password);
  }
}