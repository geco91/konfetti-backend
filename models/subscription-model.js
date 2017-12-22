const mongoose = require('mongoose');
const moment = require('moment');

const SubscriptionsSchema = new mongoose.Schema({
    type: {
        type: String,
        default: 'subscriptions'
    },
    parentUser: { // reference to parentUser
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'  
    },
    chatChannels: [{ // Array of messages (items in this channel)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatChannel'  
    }],
    lastRetrieved: {
        type: Date,
        default: new Date()
    }
});

SubscriptionsSchema.statics.getSubscriptionsForUser = function (userId, callback) {
    const Subscriptions = mongoose.model('Subscriptions');
    Subscriptions.findOne({parentUser: userId}).exec(function (err, res) {
        if (err) console.log(err);
        callback(err, res);
    });
};


SubscriptionsSchema.statics.subscribe = function (body, user, callback) { // requires body.chatChannelId
    const Subscriptions = mongoose.model('Subscriptions');
    const ChatChannel = mongoose.model('ChatChannel');

    if (body.type && body.id && user._id) {

        ChatChannel.findOne({_id: body.id}).exec(function (err, doc) {
            if (err) {
                callback(err, undefined);
            } else {
                Subscriptions.findOneAndUpdate({parentUser: user._id}, {$addToSet:{chatChannels: doc._id}}, {upsert: true, new: true},
                    (err, subscriptions) => {
                        if (err) console.log(err);
                        console.log(`added channel subscription ${doc._id} to user ${user._id}`);
                        callback(err, subscriptions);
                    });
            }
            if (err) console.log(err);
        });
    } else {
        callback(undefined, 'invalid input');
    }
};

SubscriptionsSchema.statics.unsubscribe = function (someId, user, callback) { // requires body.chatChannelId
    const Subscriptions = mongoose.model('Subscriptions');

    if (someId && user._id) {
        Subscriptions.findOneAndUpdate({parentUser: user._id}, {$pull:{chatChannels: someId}}, {upsert: true, new: true},
            (err, subscriptions) => {
                if (err) console.log(err);
                console.log(`removed ${someId} from subscriptions ${subscriptions._id} for user ${user._id}`);
                callback(err, subscriptions);
            });
    } else {
        callback(undefined, 'invalid input');
    }
};


mongoose.model('Subscriptions', SubscriptionsSchema);