import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sneaker-vault-secret";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token is required." });
  }

  jwt.verify(token, JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
};

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  };
};
