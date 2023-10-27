const blogsRouter = require('express').Router()
const Blog = require('./../models/blog')
const User = require('./../models/user')
const userExtractor = require('./../utils/middleware').userExtractor
const jwt = require('jsonwebtoken')


blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', {username: 1, name: 1})
  response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.delete('/:id', userExtractor, async (request, response) => {

  const user = request.user

  const blog = await Blog.findById(request.params.id).populate('user', {username: 1, name: 1})


  if (!blog){
    return resposne.status(404).json(
      {
        error: 'Blog not found'
      }
    )
  }

  if (blog.user.id.toString() !== user.id.toString()){
    return response.status(403).json(
      {
        error: 'You are not authorized to delete this blog'
      }
    )
  }

  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogsRouter.post('/', userExtractor, async (request, response) => {
  console.log('POST')

  const body = request.body
  const user = request.user

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    user: user.id,
    upvotes: body.upvotes
  })

  const savedBlog = await blog.save()
  console.log(savedBlog)
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.put('/:id', async (request, response) => {
  const {author, title, upvotes, url } = request.body

  const updatedPerson = await Blog.findByIdAndUpdate(
    request.params.id,
    { author, title, upvotes, url },
    { new: true, runValidators: true, context: 'query' }
).populate('user', {username: 1, name: 1})
  response.status(201).json(updatedPerson)
})


  
module.exports = blogsRouter