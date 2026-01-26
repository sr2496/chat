const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// In a real app, these should be in .env
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BLJrmlCCjITdPmf3L8o1A3K1KiPnG-IabYtuRK3c9AiZjz3s7SwVS04vLcpN5zAiisPY6j9qNmgR_PgPl_dtfbg';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'C5SV-aFJmJvYa5xdEWl-7usNL-HVd6ktIy1XT8CQoXg';

webpush.setVapidDetails(
    'mailto:test@test.com',
    publicVapidKey,
    privateVapidKey
);

const getPublicKey = (req, res) => {
    res.status(200).json({ publicKey: publicVapidKey });
};

const subscribe = async (req, res) => {
    const subscription = req.body;

    try {
        // Check if subscription already exists for this user to avoid duplicates
        // Note: endpoint is unique per device/browser usually
        const exists = await PushSubscription.findOne({
            user_id: req.user._id,
            endpoint: subscription.endpoint
        });

        if (!exists) {
            await PushSubscription.create({
                user_id: req.user._id,
                endpoint: subscription.endpoint,
                keys: subscription.keys
            });
        }

        res.status(201).json({});
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
};

const unsubscribe = async (req, res) => {
    const { endpoint } = req.body;
    try {
        await PushSubscription.findOneAndDelete({
            user_id: req.user._id,
            endpoint: endpoint
        });
        res.status(200).json({});
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Failed to unsubscribe' });
    }
};

const sendNotification = async (userId, payload) => {
    try {
        const subscriptions = await PushSubscription.find({ user_id: userId });

        const notifications = subscriptions.map(sub => {
            return webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: sub.keys
            }, JSON.stringify(payload))
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription has expired or is no longer valid
                        return PushSubscription.findByIdAndDelete(sub._id);
                    }
                    console.error("Error sending push:", err);
                });
        });

        await Promise.all(notifications);
    } catch (e) {
        console.error("Error sending notifications to user:", userId, e);
    }
};

module.exports = { getPublicKey, subscribe, unsubscribe, sendNotification };
