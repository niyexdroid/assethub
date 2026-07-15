declare global {
  namespace Express {
    interface Request {
      user?: {
        id:           string;
        email:        string;
        role:         'landlord' | 'tenant' | 'admin';
        package_type: 'standard' | 'student';
      };
    }
  }
}

export {};
