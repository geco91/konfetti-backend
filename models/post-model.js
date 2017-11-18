const mongoose = require('mongoose');
const moment = require('moment');

const PostSchema = new mongoose.Schema({
    type: {
        type: String,
        default: 'post'
    },
    // name: {
    //     type: String,
    //     unique: true,
    //     index: true
    // },
    content: {
        title: {
            type: String,
            default: ''
        },
        text: {
            type: String,
            default: ''
        }
    },
    parentThread: { // reference to parentThread
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread'  
    },
    disabled: {
        type: Boolean,
        default: false
    },
    created: {
        date: {
            type: Number,
            default: moment(new Date).unix()
        },
        byUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
});

PostSchema.statics.getPostById = function (postId, callback) {
    const Post = mongoose.model('Post');

    // TODO: check if user is allowed for neighbourhood (and thread, permisson model not yet defined)

    Post.findOne({_id: postId}).exec(function (err, res) {
        if (err) console.log(err);
        callback(err, res);
      });
};

PostSchema.statics.createPost = function (data, user, callback) {
    const Post = mongoose.model('Post');
    const Thread = mongoose.model('Thread');

    // TODO: check if user is allowed for neighbourhood (and thread, permisson model not yet defined)

    let now = moment(new Date).unix();
    let newPost = new Post({
      content : {
          title: data.title || '',
          text: data.text || ''
      },
      parentThread : data.parentThread,
      created : {
          date: now,
          byUser: user._id
      }
    }).save((err, doc) => {
      if (err) {
        console.log('Error saving new post: ' + err.message);
        callback(err, undefined);
      } else {
        Thread.findOneAndUpdate({_id: data.parentThread}, {$addToSet:{posts: doc._id}}, {upsert: true}, (err, thread) => {
            if (err) console.log(err);
            if (!thread) {
                callback('parenttread not found', null);
            } else {
                console.log(`added post ${doc._id} to thread ${thread ? thread._id : undefined}`);
                callback(err, doc);
            }
            });
      }
    });
  };

mongoose.model('Post', PostSchema);