import { Request } from "@hapi/hapi";
import { findPersonAuthorizations } from "../models/permission.model";
import { error } from "../utils/errorHandler";
import constants from "../utils/constants";

export const validatePermission = async (req: Request, requiredPermissions: string[]) => {
  try {
    const userId = req.auth.credentials.userId as string;

    const userPermissions = await findPersonAuthorizations(userId);

    if (!userPermissions || userPermissions.length === 0) {
      throw error(403, constants.NO_PERMISSION);
    }
    const activePermissions = userPermissions
      .filter((perm) => perm.status === "ACTIVE")
      .map((perm) => perm.name);

    const hasPermission = requiredPermissions.some((perm) => activePermissions.includes(perm));

    if (!hasPermission) {
      throw error(403, constants.NO_PERMISSION);
    }
  } catch (err) {
    console.error("Permission validation error:", err);
    throw err.isBoom ? err : error(500, "Internal Server Error");
  }
};
