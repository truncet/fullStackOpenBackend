const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('./../app')
const api = supertest(app)
const Blog = require('./../models/blog')
const helper = require('./test_helper')

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs
        .map(blog => new Blog(blog))
    
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)

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
    
        const resultBlog = await api
            .get(`/api/blogs/${blogToView.id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
    
        expect(resultBlog.body).toEqual(blogToView)
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
        const newBlog =       
        {
            title: "Adding a new blog",
            author: "Ranjit Nepal",
            url: "http://localhost/sorry-could-not-find-any-pages",
            upvotes: 10,
        }
        await api
            .post('/api/blogs')
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
        const newBlog = {
            title: 'New Blog Without Upvotes',
            author: 'Test Author',
            url: 'http://example.com',
        };
    
        const response = await api.post('/api/blogs').send(newBlog);
    
        expect(response.status).toBe(201);
    
        const savedBlog = response.body;
        expect(savedBlog.upvotes).toBe(0);
    });
})

describe('When addition of invalid data is attempted', () => {
    test ('A blog without title cannot be added', async() => {
        const newBlogTitle = 
            {
                author: "Ranjit Nepal",
                url: "http://localhost/sorry-could-not-find-any-pages",
                upvotes: 11,
                __v: 0
            }
    
        await api
            .post('/api/blogs')
            .send(newBlogTitle)
            .expect(400)
        
        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
                
    })
    
    test ('A blog without url cannot be added', async() => {    
        const newBlogUrl = 
            {
                author: "Ranjit Nepal",
                title: "Default Title",
                upvotes: 11,
                __v: 0
            }
        await api
            .post('/api/blogs')
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
        const blogsToStart = await helper.blogsInDb()
        const blogToDelete = blogsToStart[0]
    
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)
    
        const blogsAtEnd = await helper.blogsInDb()
        
        expect(blogsAtEnd).toHaveLength(
            helper.initialBlogs.length - 1
        )
    
        const titles = blogsAtEnd.map(n => n.title)
    
        expect(titles).not.toContain(blogToDelete.title)
    })
})


afterAll(async () => {
    await mongoose.connection.close()
})