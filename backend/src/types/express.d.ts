declare global {
  namespace Express {
    interface Request {
      user?: {
        id:           string;
        role:         'landlord' | 'tenant' | 'admin';
        package_type: 'standard' | 'student';
      };
    }
  }
}

export {};
