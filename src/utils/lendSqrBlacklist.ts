import blackListedUsersJSON from './blacklistedUsers.json';

const blackListedUsersSet = new Set(blackListedUsersJSON.map((email: string) => email.toLowerCase()));

export const isUserBlacklisted = (email: string): boolean => {
  try {
    return blackListedUsersSet.has(email.toLowerCase());
  } catch (error) {
    console.error("Error checking blacklist:", error);
    return false; 
  }
};
