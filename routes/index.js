var express = require('express');
var router = express.Router();
var userModel = require('./users');
const postModel = require('./post');
const passport = require('passport');
const localStrategy = require('passport-local');
var multer = require('multer');
const { populate } = require('./users');
const { axios } = require('axios');



passport.use(new localStrategy(userModel.authenticate()));



var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    var date = new Date();
    var filename = date.getTime() + file.originalname;
    cb(null, filename);
  }
})
 
var upload = multer({ storage: storage })


/* GET home page. */
router.get('/',function(req, res){
  if(req.isAuthenticated()){
    postModel.findRandom({}, {}, { limit: 3, populate:'author'}, function(err, results) {
      if (!err) {
       res.render('index', { title: 'Bloggy', loggedIn: true, results: results, });
      }
    });
  }
  else{
    postModel.findRandom({}, {}, { limit: 3, populate:'author'}, function(err, results) {
      if (!err) {
    res.render('index', { title: 'Bloggy', loggedIn: false, results: results,  });
      }
    });
  }
});




router.get('/profile', isLoggedIn,function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .populate('posts')
  .exec(function(err, data){
    res.render('profile', {details: data});
  })
})

router.get('/login', function(req,res){
  res.render('login')
});

router.get('/register', function(req, res){
  res.render('register');
});

router.get('/like/:id', function(req, res){
  postModel.findOne({_id: req.params.id})
  .then(function(foundpost){
    if(foundpost.likes.indexOf(req.session.passport.user) === -1 && foundpost.dislikes.indexOf(req.session.passport.user) === -1 ){
      foundpost.likes.push(req.session.passport.user);
      foundpost.save()
        .then(function(savePosts){
         res.redirect('/profile');
        })
    }
    else{
     if(foundpost.dislikes.indexOf(req.session.passport.user) !== -1){
       var index = foundpost.dislikes.indexOf(req.session.passport.user);
       if ( index !== -1 ) foundpost.dislikes.splice(index , 1);
       foundpost.likes.push(req.session.passport.user);
       foundpost.save()
       .then(function(savepost){
         res.redirect('/profile');
       })
     }
     else{
      var index = foundpost.likes.indexOf(req.session.passport.user);
      if ( index !== -1 ) foundpost.likes.splice(index , 1);
      foundpost.save()
      .then(function(savepost){
        res.redirect('/profile');
      })
     }
    }
  })
})

router.get('/delete/:id',isLoggedIn,function(req, res){
  postModel.findOneAndDelete({_id: req.params.id})
  .then(function(deletePost){
    res.redirect('/profile')
  })
})


router.get('/update/:username', function(req, res){
userModel.findOne({username:req.params.username})
.then(function(foundUser){
  res.render('update',{details: foundUser});
})
});

router.post('/update', isLoggedIn,function(req, res){
  userModel.findOneAndUpdate({username: req.session.passport.user}, {
    name:req.body.name,
    username:req.body.username,
    email:req.body.email
  }, {new:true})
  .then(function(updatedUser){
    res.redirect('/profile');
  })
})

router.post('/upload', upload.single('image'),function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    foundUser.profileImage = `./images/uploads/${req.file.filename}`;
    foundUser.save()
    .then(function(){
      res.redirect('profile');
    })
  })
})

router.post('/postblog', function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    postModel.create({
      author: foundUser._id,
      post:req.body.post
    }).then(function(createdPost){
      foundUser.posts.push(createdPost);
      foundUser.save()
      .then(function(){
        res.redirect('/profile');
      })
    })
  })
})

router.get('/blogs', function(req, res){
   postModel.find()
    .then(function(allblogs){
      res.send(allblogs);
    })
});


router.post('/register', function(req, res){
  var userData = new userModel ({
     name:req.body.name,
     username:req.body.username,
     email:req.body.email
  })
  userModel.register(userData, req.body.password)
   .then(function(registeredUser){
     passport.authenticate('local')(req, res, function(){
      res.redirect('/profile');
     })
   })
})

router.post('/login', passport.authenticate('local', {
  successRedirect:'/profile',
  failureRedirect:'/'
}),function(req, res){});


router.get('/logout', function(req, res){
  req.logOut();
  res.redirect('/');
})


function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    req.flash('error', 'You Need To Login First !')
    res.redirect('/login');
  }
} 


module.exports = router;









