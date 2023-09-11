var mongoose = require('mongoose');
var plm = require('passport-local-mongoose');


mongoose.set("strictQuery", true);

mongoose.connect('mongodb://localhost/blogapp1');

var userSchema = mongoose.Schema({
  name:'String',
  username:'String',
  profileImage:{
    type:'String',
    default:'./images/uploads/default.jpg'
  },
  posts:[
    { type: mongoose.Schema.Types.ObjectId,
    ref:'posts'}
  ],
  email:'String',
  password:'String'
})

userSchema.plugin(plm);

module.exports = mongoose.model('users', userSchema);

 