import blackListedUsersJSON from './blacklistedUsers.json'

export const isUserBlacklisted = async (email: string): Promise<boolean> => {
  try {

    return blackListedUsersJSON.includes(email.toLowerCase());
  } catch (error) {
    console.error("Error reading blacklist file:", error);
    return false; 
  }
};
