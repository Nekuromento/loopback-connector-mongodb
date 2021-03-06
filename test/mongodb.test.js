// This test written in mocha+should.js
var should = require('./init.js');

var User, Post, PostWithStringId, db;

describe('mongodb', function () {

  before(function () {
    db = getDataSource();

    User = db.define('User', {
      name: { type: String, index: true },
      email: { type: String, index: true },
      age: Number,
    });

    Post = db.define('Post', {
      title: { type: String, length: 255, index: true },
      content: { type: String }
    });

    PostWithStringId = db.define('PostWithStringId', {
      id: {type: String, id: true},
      title: { type: String, length: 255, index: true },
      content: { type: String }
    });

    User.hasMany(Post);
    Post.belongsTo(User);
  });

  beforeEach(function (done) {
    User.destroyAll(function () {
      Post.destroyAll(function () {
        done();
      });
    });
  });

  it('hasMany should support additional conditions', function (done) {
    User.create(function (e, u) {
      u.posts.create({}, function (e, p) {
        u.posts({where: {_id: p.id}}, function (err, posts) {
          should.not.exist(err);
          posts.should.have.lengthOf(1);

          done();
        });
      });
    });
  });

  it('should allow to find by id string', function (done) {
    Post.create(function (err, post) {
      Post.find(post.id.toString(), function (err, post) {
        should.not.exist(err);
        should.exist(post);

        done();
      });
    });
  });

  it('find should return an object with an id, which is instanceof ObjectId', function (done) {
    Post.create(function (err, post) {
      Post.findById(post.id, function (err, post) {
        should.not.exist(err);
        post.id.should.be.an.instanceOf(db.ObjectID);
        post._id.should.be.an.instanceOf(db.ObjectID);

        done();
      });

    });
  });

  it('should update the instance', function (done) {
    Post.create({title: 'a', content: 'AAA'}, function (err, post) {
      post.title = 'b';
      Post.updateOrCreate(post, function (err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);
        p.content.should.be.equal(post.content);

        Post.findById(post.id, function (err, p) {
          p.id.should.be.equal(post.id);
          p.content.should.be.equal(post.content);
          p.title.should.be.equal('b');
          done();
        });
      });

    });
  });

  it('all should return object with an id, which is instanceof ObjectID', function (done) {
    var post = new Post({title: 'a', content: 'AAA'})
    post.save(function (err, post) {
      Post.all({where: {title: 'a'}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.lengthOf(1);
        post = posts[0];
        post.should.have.property('title', 'a');
        post.should.have.property('content', 'AAA');
        post.id.should.be.an.instanceOf(db.ObjectID);
        post._id.should.be.an.instanceOf(db.ObjectID);

        done();
      });

    });
  });

  it('all should return honor filter.fields', function (done) {
    var post = new Post({title: 'b', content: 'BBB'})
    post.save(function (err, post) {
      Post.all({fields: ['title'], where: {title: 'b'}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.lengthOf(1);
        post = posts[0];
        post.should.have.property('title', 'b');
        post.should.not.have.property('content');
        done();
      });

    });
  });

  it('create should convert id from string to ObjectID if format matches',
    function (done) {
      var oid = new db.ObjectID().toString();
      PostWithStringId.create({id: oid, title: 'c', content: 'CCC'}, function (err, post) {
        PostWithStringId.findById(oid, function (err, post) {
          should.not.exist(err);
          post.id.should.be.equal(oid);
          done();
        });
      });
    });

  it('should report error on duplicate keys', function (done) {
    Post.create({title: 'd', content: 'DDD'}, function (err, post) {
      Post.create({id: post.id, title: 'd', content: 'DDD'}, function (err, post) {
        should.exist(err);
        done();
      });
    });
  });

  it('should allow to find using like', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {title: {like: 'M.+st'}}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  it('should support like for no match', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {title: {like: 'M.+XY'}}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });

  it('should allow to find using nlike', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {title: {nlike: 'M.+st'}}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });

  it('should support nlike for no match', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {title: {nlike: 'M.+XY'}}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  after(function (done) {
    User.destroyAll(function () {
      Post.destroyAll(done);
    });
  });
});

