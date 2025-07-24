const responseData = Object.freeze({
    EXIST: 'Record Exist',
    INVALID_EMAIL: 'Invalid Email Format',
    GENERIC_ERROR: 'Internal server error occured, please try again in a bit...',
    INVALID_CREDENTIALS: 'Wrong user credentials',
    INVALID_ACCESS: 'User account is not activated',
    NO_PERMISSION: 'Access Denied: You do not have access to this feature',
    BLACKLISTED_USER: 'You are blacklisted and cannot create an account.',
    INVALID_PIN: 'Invalid Pin',
    NOT_FOUND: 'Not Found',
    INSUFFICIENT_FUNDS: 'Insufficient Funds'
})

export default responseData;