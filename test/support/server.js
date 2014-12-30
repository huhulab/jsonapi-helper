var express = require('express');

var app = module.exports = express();

app.set('json spaces', 2);

app.use(function (req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', '*');
  res.set(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Content-Length, Referer'
  );
  res.set('Access-Control-Expose-Headers', 'Content-Length');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  return next();
});

var posts = require('./posts.json');
var comments = require('./comments.json');
var people = require('./people.json');

var _getRandomInt = function (limit) {
  return ~~(Math.random() * limit);
};

var _getRandomArray = function (length) {
  var i;
  var result = [];

  for (i = 0; i < length; i++) {
    result.push(_getRandomInt(1000).toString());
  }

  return result;
};

app.get('/posts', function (req, res) {
  res.json(posts);
});

app.get('/comments', function (req, res) {
  res.json(comments);
});

app.get('/people', function (req, res) {
  res.json(people);
});

app.get('/posts/:id', function (req, res) {
  var random4 = _getRandomArray(4);
  var post = {
    posts: {
      id: req.params.id,
      title: 'Post Title ' + req.params.id,
      links: {
        author: random4[0],
        comments: [random4[1], random4[2], random4[3]]
      }
    },
    links: {
      'posts.author': {
        'href': '/people/{posts.author}',
        'type': 'people'
      },
      'posts.comments': {
        'href': '/comments/{posts.comments}',
        'type': 'comments'
      }
    },
    linked: {
      'people': [{
        id: random4[0],
        name: '@P' + random4[0]
      }],
      'comments': [{
        id: random4[1],
        body: 'Comment ' + random4[1]
      },
      {
        id: random4[2],
        body: 'Comment ' + random4[2]
      },
      {
        id: random4[3],
        body: 'Comment ' + random4[3]
      }]
    }
  };

  res.json(post);
});

app.get('/comments/:id', function (req, res) {
  var comment = {
    id: req.params.id,
    title: 'Comment Title ' + req.params.id
  };

  res.json({comments: comment});
});

app.get('/people/:id', function (req, res) {
  var person = {
    id: req.params.id,
    name: '@P' + req.params.id
  };

  res.json({people: person});
});

app.get('/empty', function (req, res) {
  var emptyCollection = [];

  res.json({empty: emptyCollection});
});

app.get('/empty/:id', function (req, res) {
  var emptyItem = {};

  res.json({empty: emptyItem});
});
