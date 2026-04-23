import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize the Twilio Client
export const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const myTwilioNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;
