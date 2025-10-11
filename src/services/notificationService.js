// services/notificationService.js
const { Expo } = require("expo-server-sdk");

// Create a new Expo SDK client
const expo = new Expo();
// const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

// Send notification to a given vendor token
exports.sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const message = {
    to: pushToken,
    sound: "default", // will play default notification sound
    title,
    body,
    data,
  };

  try {
    let tickets = await expo.sendPushNotificationsAsync([message]);
    console.log("Notification sent:", tickets);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
