import blackListedUsersJSON from "./blacklistedUsers.json";

const blackListedUsersSet = new Set(
  blackListedUsersJSON.flatMap((user: { email: string; phone_number: string }) => [
    user.email.toLowerCase(),
    user.phone_number
  ])
);

export const isUserBlacklisted = (email: string, phone_number: string): boolean => {
  try {
    return (
      blackListedUsersSet.has(email.toLowerCase()) || blackListedUsersSet.has(phone_number)
    );
  } catch (error) {
    console.error("Error checking blacklist:", error);
    return false;
  }
};
