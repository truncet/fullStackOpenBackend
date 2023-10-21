const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const supertest = require('supertest')
const app = require('./../app')
const api = supertest(app)
const Blog = require('./../models/blog')
const User = require('./../models/user')
const helper = require('./test_helper')


const newUsers = {
    username: 'testuser',
    name: 'testuser',
    password: 'testpassword'
}

const registerUsers = async() => {
    await api
    .post('/api/users')
    .send(newUsers);
}

const getToken =  async () => {
    const response = await api
        .post('/api/login')
        .send(newUsers)

    return response.body.token
}


beforeEach(async () => {
    await User.deleteMany({})
    await registerUsers();

    await Blog.deleteMany({})


    const token = await getToken()

    await Promise.all(helper.initialBlogs.map(async (blog) => {
        const response = await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(blog)
    }))

})



describe('When there is initally some blogs saved',() => {
    test ('Blogs are returned as json', async() => {
        await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    }, 100000)
    
    
    test ('There are two blogs', async () => {
        const response = await api.get('/api/blogs')
        expect(response.body).toHaveLength(2)
    })
    
    test('Blog posts have a property named "id"', async () => {
        const response = await api.get('/api/blogs');
        expect(response.body[0].id).toBeDefined();
    });
})

describe('When specific blog is viewed', () => {
    test ('A specific blog can be viewed', async () => {
        const blogAtStart = await helper.blogsInDb()
        const blogToView = blogAtStart[0]
        
        const expectedBlog = {
            author: blogToView.author,
            title: blogToView.title,
            url: blogToView.url,
            upvotes: blogToView.upvotes,
            user: blogToView.user.toString(),
            id: blogToView.id,
        }

        const resultBlog = await api
            .get(`/api/blogs/${blogToView.id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
    
        expect(resultBlog.body).toEqual(expectedBlog)
    })

    test('fails with statuscode 404 if id does not exist', async () => {
        const validNonexistingId = await helper.nonExistingId()
    
        await api
          .get(`/api/blogs/${validNonexistingId}`)
          .expect(404)
      })
})

describe('A new Blog is added', () => {
    test ('A valid blog can be added', async () => {
        const token = await getToken();
        const newBlog =       
        {
            title: "Adding a new blog",
            author: "Ranjit Nepal",
            url: "http://localhost/sorry-could-not-find-any-pages",
            upvotes: 10,
        }
        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
    
        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
        const title = blogsAtEnd.map(n => n.title)
        expect(title).toContain(
            'Adding a new blog'
        )
    })
    
    test('Upvotes property defaults to 0 if missing', async () => {
        const token = await getToken();
        const newBlog = {
            title: 'New Blog Without Upvotes',
            author: 'Test Author',
            url: 'http://example.com',
        };
    
        const response = await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog);
    
        expect(response.status).toBe(201);
    
        const savedBlog = response.body;
        expect(savedBlog.upvotes).toBe(0);
    });
})

describe('When addition of invalid data is attempted', () => {
    test ('A blog without title cannot be added', async() => {
        const token = await getToken();
        const newBlogTitle = 
            {
                author: "Ranjit Nepal",
                url: "http://localhost/sorry-could-not-find-any-pages",
                upvotes: 11,
                __v: 0
            }
    
        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlogTitle)
            .expect(400)
        
        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
                
    })
    
    test ('A blog without url cannot be added', async() => {    
        const token = await getToken();
        const newBlogUrl = 
            {
                author: "Ranjit Nepal",
                title: "Default Title",
                upvotes: 11,
                __v: 0
            }
        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlogUrl)
            .expect(400)
        
        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
                
    })
})

describe('Updating of a blog', () => {
    test('updating upvotes for a blog', async() => {
        const blogs = await helper.blogsInDb()
        const blogToUpdate = blogs[0]
        const oldUpvotes = blogToUpdate.upvotes

        blogToUpdate.upvotes = blogToUpdate.upvotes + 1
        const response = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send(blogToUpdate)
            .expect(201)

        expect(response.body.upvotes).toBe(oldUpvotes + 1)
    })
})


describe('Deletion of a blog', () => {
    test ('A blog can be deleted', async() => {
        const token = await getToken();
        const blogsToStart = await helper.blogsInDb()
        const blogToDelete = blogsToStart[0]
    
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)
    
        const blogsAtEnd = await helper.blogsInDb()
        
        expect(blogsAtEnd).toHaveLength(
            helper.initialBlogs.length - 1
        )
    
        const titles = blogsAtEnd.map(n => n.title)
    
        expect(titles).not.toContain(blogToDelete.title)
    })
})


describe('when there is initially one user in db', () => {
    beforeEach(async () => {
      await User.deleteMany({})
  
      const passwordHash = await bcrypt.hash('sekret', 10)
      const user = new User({ username: 'root', passwordHash })
  
      await user.save()
    })
  
    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()
  
      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }
  
      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)
  
      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)
  
      const usernames = usersAtEnd.map(u => u.username)
      expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
          username: 'root',
          name: 'Superuser',
          password: 'salainen',
        }
    
        const result = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)
          .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('expected `username` to be unique')
    
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
      })
})

  describe('Invalid User Creation', () => {
    test('Creation of a user without a username should fail with a 400 Bad Request', async () => {
        const newUser = {
            name: 'John Doe',
            password: 'password123',
        };

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(400);

        expect(response.body.error).toContain('`username` is required');
    });

    test('Creation of a user with a short username should fail with a 400 Bad Request', async () => {
        const newUser = {
            username: 'us',
            name: 'John Doe',
            password: 'password123',
        };

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(400);

        expect(response.body.error).toContain('is shorter than the minimum allowed length');
    });

    test('Creation of a user without a password should fail with a 400 Bad Request', async () => {
        const newUser = {
            username: 'johndoe',
            name: 'John Doe',
        };

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(400);

        expect(response.body.error).toContain('Password is required');
    });

    test('Creation of a user with a short password should fail with a 400 Bad Request', async () => {
        const newUser = {
            username: 'johndoe',
            name: 'John Doe',
            password: 'pw', // Short password
        };

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(400);

        expect(response.body.error).toContain('Password must at least be 3 characters long');
    });

    test('Creation of a user with a non-unique username should fail with a 400 Bad Request', async () => {
        const newUser = {
            username: 'testuser', // An existing username
            name: 'John Doe',
            password: 'password123',
        };

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(400);

        expect(response.body.error).toContain('expected `username` to be unique');
    });
});



afterAll(async () => {

    await mongoose.connection.close()
})